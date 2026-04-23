package com.trd.service.impl;

import com.trd.dto.PredictionResponse;
import com.trd.entity.Prediction;
import com.trd.entity.Stock;
import com.trd.entity.User;
import com.trd.exception.BadRequestException;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.PredictionRepository;
import com.trd.repository.StockRepository;
import com.trd.repository.UserRepository;
import com.trd.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionServiceImpl implements PredictionService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal MIN_CONFIDENCE = BigDecimal.valueOf(55);
    private static final BigDecimal MAX_CONFIDENCE = BigDecimal.valueOf(95);
    private static final BigDecimal FALLBACK_CONFIDENCE_PENALTY = BigDecimal.valueOf(10);

    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    @Value("${prediction.python.command:python}")
    private String pythonCommand;

    @Value("${prediction.python.script:predict.py}")
    private String pythonScript;

    @Value("${prediction.python.timeout-seconds:60}")
    private long pythonTimeoutSeconds;

    @Override
    @Transactional
    public PredictionResponse createPrediction(Long userId, Long stockId, int daysAhead) {
        if (daysAhead < 1) {
            throw new BadRequestException("daysAhead must be at least 1");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Stock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + stockId));

        BigDecimal currentPrice = requirePrice(stock.getCurrentPrice(),
            "Current price is not available for stock: " + stock.getSymbol());
        PredictionResult predictionResult = generatePrediction(stock, daysAhead);
        LocalDateTime now = LocalDateTime.now();
        String trend = determineTrend(currentPrice, predictionResult.predictedPrice());

        Prediction prediction = new Prediction();
        prediction.setUser(user);
        prediction.setStock(stock);
        prediction.setPredictedPrice(predictionResult.predictedPrice());
        prediction.setActualPrice(currentPrice);
        prediction.setPredictionType(trend);
        prediction.setConfidence(calculateConfidence(stock, predictionResult.usedFallback()));
        prediction.setPredictionDate(now);
        prediction.setTargetDate(now.plusDays(daysAhead));
        prediction.setIsAccurate(null);

        return mapToResponse(predictionRepository.save(prediction));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredictionResponse> getUserPredictions(Long userId) {
        return predictionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredictionResponse> getStockPredictions(Long stockId) {
        return predictionRepository.findByStockId(stockId).stream()
            .sorted(Comparator.comparing(Prediction::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private PredictionResponse mapToResponse(Prediction prediction) {
        PredictionResponse response = new PredictionResponse();
        response.setId(prediction.getId());
        response.setStockSymbol(prediction.getStock().getSymbol());
        response.setStockName(prediction.getStock().getName());
        response.setPredictedPrice(prediction.getPredictedPrice());

        BigDecimal actualPrice = prediction.getActualPrice() != null
            ? prediction.getActualPrice()
            : prediction.getStock().getCurrentPrice();
        response.setActualPrice(actualPrice);

        String trend = normalizeTrend(prediction.getPredictionType(), prediction.getPredictedPrice(), actualPrice);
        response.setPredictionType(trend);
        response.setTrend(trend);
        response.setConfidence(prediction.getConfidence());
        response.setPredictionDate(prediction.getPredictionDate());
        response.setTargetDate(prediction.getTargetDate());
        response.setIsAccurate(prediction.getIsAccurate());
        response.setCreatedAt(prediction.getCreatedAt());
        return response;
    }

    private PredictionResult generatePrediction(Stock stock, int daysAhead) {
        BigDecimal fallbackPrice = calculateFallbackPredictedPrice(stock, daysAhead);

        try {
            BigDecimal pythonPrediction = runPythonPrediction(stock.getSymbol());
            log.info("Generated ML prediction for {} using Python model: {}", stock.getSymbol(), pythonPrediction);
            return new PredictionResult(pythonPrediction, false);
        } catch (Exception ex) {
            log.warn("Falling back to Java prediction logic for {} because Python prediction failed: {}",
                stock.getSymbol(), ex.getMessage());
            return new PredictionResult(fallbackPrice, true);
        }
    }

    private BigDecimal runPythonPrediction(String symbol) throws IOException, InterruptedException {
        Path scriptPath = resolvePythonScript();

        ProcessBuilder processBuilder = new ProcessBuilder(
            pythonCommand,
            scriptPath.toString(),
            symbol
        );
        processBuilder.directory(scriptPath.getParent().toFile());

        Process process = processBuilder.start();
        boolean finished = process.waitFor(pythonTimeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("Python prediction process timed out");
        }

        String standardOutput = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        String errorOutput = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8).trim();

        if (process.exitValue() != 0) {
            throw new IllegalStateException(errorOutput.isBlank()
                ? "Python script exited with code " + process.exitValue()
                : errorOutput);
        }

        BigDecimal predictedPrice = parsePredictedPrice(standardOutput);
        if (predictedPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Python script returned a non-positive price");
        }

        return predictedPrice.setScale(2, RoundingMode.HALF_UP);
    }

    private Path resolvePythonScript() {
        List<Path> candidates = List.of(
            Paths.get(pythonScript),
            Paths.get("backend").resolve(pythonScript),
            Paths.get("..").resolve(pythonScript)
        );

        return candidates.stream()
            .map(Path::toAbsolutePath)
            .filter(Files::exists)
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Python script not found: " + pythonScript));
    }

    private BigDecimal parsePredictedPrice(String output) {
        if (output == null || output.isBlank()) {
            throw new IllegalStateException("Python script returned empty output");
        }

        String[] lines = output.split("\\R");
        for (int index = lines.length - 1; index >= 0; index--) {
            String line = lines[index].trim();
            if (!line.isEmpty()) {
                return new BigDecimal(line);
            }
        }

        throw new IllegalStateException("Python script did not return a numeric prediction");
    }

    private BigDecimal calculateFallbackPredictedPrice(Stock stock, int daysAhead) {
        BigDecimal currentPrice = requirePrice(stock.getCurrentPrice(),
            "Current price is not available for stock: " + stock.getSymbol());
        BigDecimal previousPrice = stock.getPreviousPrice();

        if (previousPrice == null || previousPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return currentPrice.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal dailyTrend = currentPrice.subtract(previousPrice)
            .divide(previousPrice, 6, RoundingMode.HALF_UP);
        BigDecimal scaledTrend = dailyTrend.multiply(BigDecimal.valueOf(Math.min(daysAhead, 10L)))
            .divide(BigDecimal.TEN, 6, RoundingMode.HALF_UP);
        BigDecimal predictedPrice = currentPrice.multiply(BigDecimal.ONE.add(scaledTrend));

        if (predictedPrice.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return predictedPrice.setScale(2, RoundingMode.HALF_UP);
    }

    private String determineTrend(BigDecimal currentPrice, BigDecimal predictedPrice) {
        return predictedPrice.compareTo(currentPrice) >= 0 ? "UP" : "DOWN";
    }

    private String normalizeTrend(String predictionType, BigDecimal predictedPrice, BigDecimal actualPrice) {
        if (predictionType == null || predictionType.isBlank()) {
            return deriveTrendFromPrices(predictedPrice, actualPrice);
        }

        return switch (predictionType.toUpperCase()) {
            case "UP", "BULLISH", "STABLE" -> "UP";
            case "DOWN", "BEARISH" -> "DOWN";
            default -> deriveTrendFromPrices(predictedPrice, actualPrice);
        };
    }

    private String deriveTrendFromPrices(BigDecimal predictedPrice, BigDecimal actualPrice) {
        if (predictedPrice == null || actualPrice == null) {
            return "UP";
        }
        return predictedPrice.compareTo(actualPrice) >= 0 ? "UP" : "DOWN";
    }

    private BigDecimal calculateConfidence(Stock stock, boolean usedFallback) {
        BigDecimal currentPrice = requirePrice(stock.getCurrentPrice(),
            "Current price is not available for stock: " + stock.getSymbol());
        BigDecimal previousPrice = stock.getPreviousPrice();

        BigDecimal confidence = BigDecimal.valueOf(88);
        if (previousPrice != null && previousPrice.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal volatility = currentPrice.subtract(previousPrice)
                .abs()
                .divide(previousPrice, 4, RoundingMode.HALF_UP)
                .multiply(HUNDRED);
            confidence = confidence.subtract(volatility);
        }

        if (usedFallback) {
            confidence = confidence.subtract(FALLBACK_CONFIDENCE_PENALTY);
        }

        if (confidence.compareTo(MIN_CONFIDENCE) < 0) {
            confidence = MIN_CONFIDENCE;
        }
        if (confidence.compareTo(MAX_CONFIDENCE) > 0) {
            confidence = MAX_CONFIDENCE;
        }

        return confidence.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal requirePrice(BigDecimal price, String message) {
        if (price == null) {
            throw new BadRequestException(message);
        }
        return price;
    }

    private record PredictionResult(BigDecimal predictedPrice, boolean usedFallback) {
    }
}
