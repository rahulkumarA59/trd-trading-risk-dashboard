package com.trd.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Service for fetching real-time stock prices from Alpha Vantage API.
 * Provides integration with external stock data APIs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalStockApiService {

    private static final String DEMO_API_KEY = "demo";
    private static final String GLOBAL_QUOTE_NODE = "Global Quote";
    private static final String PRICE_FIELD = "05. price";
    private static final String CHANGE_FIELD = "09. change";
    private static final String CHANGE_PERCENT_FIELD = "10. change percent";
    private static final String VOLUME_FIELD = "06. volume";

    @Value("${stock.api.key:demo}")
    private String apiKey;

    @Value("${stock.api.base-url:https://www.alphavantage.co/query}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean missingApiKeyWarningLogged = new AtomicBoolean(false);
    private final Set<String> demoKeyWarnings = ConcurrentHashMap.newKeySet();

    /**
     * Fetches live stock price for a given symbol from Alpha Vantage API.
     *
     * @param symbol the stock symbol (e.g., "AAPL")
     * @return Optional containing the BigDecimal price if successful
     */
    public Optional<BigDecimal> getLiveStockPrice(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        if (normalizedSymbol == null || !isApiConfiguredForSymbol(normalizedSymbol)) {
            return Optional.empty();
        }

        try {
            String url = buildAlphaVantageUrl(normalizedSymbol);
            log.debug("Fetching stock price from API for symbol: {}", normalizedSymbol);

            String response = executeApiCall(url);
            return parsePrice(response, normalizedSymbol);

        } catch (Exception e) {
            log.error("Error fetching live stock price for symbol: {}. Error: {}", normalizedSymbol, e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Fetches comprehensive stock data including price, volume, and market cap.
     *
     * @param symbol the stock symbol
     * @return Optional containing StockData if successful
     */
    public Optional<StockData> getLiveStockData(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        if (normalizedSymbol == null || !isApiConfiguredForSymbol(normalizedSymbol)) {
            return Optional.empty();
        }

        try {
            String url = buildAlphaVantageUrl(normalizedSymbol);
            log.debug("Fetching comprehensive stock data from API for symbol: {}", normalizedSymbol);

            String response = executeApiCall(url);
            return parseStockData(response, normalizedSymbol);

        } catch (Exception e) {
            log.error("Error fetching comprehensive stock data for symbol: {}. Error: {}", normalizedSymbol, e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Builds the Alpha Vantage API URL for the given symbol.
     *
     * @param symbol the stock symbol
     * @return the complete API URL
     */
    private String buildAlphaVantageUrl(String symbol) {
        return UriComponentsBuilder.fromHttpUrl(baseUrl)
                .queryParam("function", "GLOBAL_QUOTE")
                .queryParam("symbol", symbol)
                .queryParam("apikey", apiKey)
                .toUriString();
    }

    /**
     * Executes the API call with timeout handling.
     *
     * @param url the API URL
     * @return the API response as a string
     * @throws RestClientException if API call fails
     */
    private String executeApiCall(String url) throws RestClientException {
        try {
            String response = restTemplate.getForObject(url, String.class);
            if (!StringUtils.hasText(response)) {
                throw new RestClientException("Empty response from stock API");
            }
            return response;
        } catch (RestClientException e) {
            log.error("RestTemplate API call failed for URL: {}. Error: {}", url, e.getMessage());
            throw e;
        }
    }

    /**
     * Parses the API response to extract the current price.
     *
     * @param response the JSON response from API
     * @param symbol the stock symbol
     * @return Optional containing the price if parsing succeeds
     */
    private Optional<BigDecimal> parsePrice(String response, String symbol) {
        try {
            JsonNode root = objectMapper.readTree(response);

            if (hasApiError(root, symbol)) {
                return Optional.empty();
            }

            JsonNode globalQuote = root.path(GLOBAL_QUOTE_NODE);
            if (globalQuote.isMissingNode() || globalQuote.isEmpty()) {
                log.warn("Price data not available for symbol: {} in response", symbol);
                return Optional.empty();
            }

            Optional<BigDecimal> price = parseDecimal(globalQuote, PRICE_FIELD);
            if (price.isEmpty()) {
                log.warn("Empty or invalid price value for symbol: {}", symbol);
                return Optional.empty();
            }

            log.debug("Successfully parsed price for symbol {}: {}", symbol, price.get());
            return price;

        } catch (Exception e) {
            log.error("Error parsing price from API response for symbol: {}. Error: {}", symbol, e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Parses the API response to extract comprehensive stock data.
     *
     * @param response the JSON response from API
     * @param symbol the stock symbol
     * @return Optional containing StockData if parsing succeeds
     */
    private Optional<StockData> parseStockData(String response, String symbol) {
        try {
            JsonNode root = objectMapper.readTree(response);

            if (hasApiError(root, symbol)) {
                return Optional.empty();
            }

            JsonNode globalQuote = root.path(GLOBAL_QUOTE_NODE);
            if (globalQuote.isMissingNode() || globalQuote.isEmpty()) {
                log.warn("Global Quote data not available for symbol: {}", symbol);
                return Optional.empty();
            }

            StockData stockData = new StockData();
            stockData.setSymbol(symbol);

            parseDecimal(globalQuote, PRICE_FIELD).ifPresent(stockData::setPrice);
            parseDecimal(globalQuote, CHANGE_FIELD).ifPresent(stockData::setChange);
            parsePercent(globalQuote, CHANGE_PERCENT_FIELD).ifPresent(stockData::setChangePercent);
            parseLong(globalQuote, VOLUME_FIELD).ifPresent(stockData::setVolume);

            log.debug("Successfully parsed stock data for symbol {}: {}", symbol, stockData);
            return Optional.of(stockData);

        } catch (Exception e) {
            log.error("Error parsing stock data from API response for symbol: {}. Error: {}", symbol, e.getMessage(), e);
            return Optional.empty();
        }
    }

    private String normalizeSymbol(String symbol) {
        if (!StringUtils.hasText(symbol)) {
            log.warn("Invalid stock symbol provided: {}", symbol);
            return null;
        }
        return symbol.trim().toUpperCase();
    }

    private boolean isApiConfiguredForSymbol(String symbol) {
        if (!StringUtils.hasText(apiKey)) {
            if (missingApiKeyWarningLogged.compareAndSet(false, true)) {
                log.warn("Stock API key is not configured. Live price sync is disabled until stock.api.key is set.");
            }
            return false;
        }

        if (DEMO_API_KEY.equalsIgnoreCase(apiKey) && !"IBM".equalsIgnoreCase(symbol)) {
            if (demoKeyWarnings.add(symbol)) {
                log.warn("Alpha Vantage demo key only returns sample data for IBM. Configure stock.api.key to sync {}", symbol);
            }
            return false;
        }

        return true;
    }

    private boolean hasApiError(JsonNode root, String symbol) {
        if (root.has("Error Message")) {
            log.warn("API error for symbol {}: {}", symbol, root.path("Error Message").asText());
            return true;
        }

        if (root.has("Note")) {
            log.warn("API rate limit or quota issue for symbol {}: {}", symbol, root.path("Note").asText());
            return true;
        }

        if (root.has("Information")) {
            log.warn("API information for symbol {}: {}", symbol, root.path("Information").asText());
            return true;
        }

        return false;
    }

    private Optional<BigDecimal> parseDecimal(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || !StringUtils.hasText(node.path(fieldName).asText())) {
            return Optional.empty();
        }

        try {
            return Optional.of(new BigDecimal(node.path(fieldName).asText()));
        } catch (NumberFormatException ex) {
            log.debug("Unable to parse decimal field {} from value {}", fieldName, node.path(fieldName).asText());
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> parsePercent(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || !StringUtils.hasText(node.path(fieldName).asText())) {
            return Optional.empty();
        }

        try {
            String rawValue = node.path(fieldName).asText().replace("%", "").trim();
            return Optional.of(new BigDecimal(rawValue));
        } catch (NumberFormatException ex) {
            log.debug("Unable to parse percent field {} from value {}", fieldName, node.path(fieldName).asText());
            return Optional.empty();
        }
    }

    private Optional<Long> parseLong(JsonNode node, String fieldName) {
        if (!node.has(fieldName) || !StringUtils.hasText(node.path(fieldName).asText())) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.parseLong(node.path(fieldName).asText()));
        } catch (NumberFormatException ex) {
            log.debug("Unable to parse long field {} from value {}", fieldName, node.path(fieldName).asText());
            return Optional.empty();
        }
    }

    /**
     * DTO for stock data returned from API.
     */
    public static class StockData {
        public String symbol;
        public BigDecimal price;
        public BigDecimal change;
        public BigDecimal changePercent;
        public Long volume;

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public BigDecimal getChange() {
            return change;
        }

        public void setChange(BigDecimal change) {
            this.change = change;
        }

        public BigDecimal getChangePercent() {
            return changePercent;
        }

        public void setChangePercent(BigDecimal changePercent) {
            this.changePercent = changePercent;
        }

        public Long getVolume() {
            return volume;
        }

        public void setVolume(Long volume) {
            this.volume = volume;
        }

        @Override
        public String toString() {
            return "StockData{" +
                    "symbol='" + symbol + '\'' +
                    ", price=" + price +
                    ", change=" + change +
                    ", changePercent=" + changePercent +
                    ", volume=" + volume +
                    '}';
        }
    }
}

