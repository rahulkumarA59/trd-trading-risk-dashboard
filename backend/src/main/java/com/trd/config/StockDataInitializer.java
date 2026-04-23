package com.trd.config;

import com.trd.entity.Stock;
import com.trd.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockDataInitializer {

    private final StockRepository stockRepository;

    @Value("${stock.bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedStocksIfNeeded() {
        if (!bootstrapEnabled) {
            log.info("Default stock bootstrap is disabled");
            return;
        }

        if (stockRepository.count() > 0) {
            log.info("Stock bootstrap skipped because the stocks table already has data");
            return;
        }

        List<Stock> starterStocks = List.of(
                buildStock("AAPL", "Apple Inc.", "Technology", 210.15, 207.80, 3100000000000L, 52345000L,
                        "Apple Inc. designs, manufactures, and sells iPhones, iPods, Macs, and related software and services."),
                buildStock("MSFT", "Microsoft Corporation", "Technology", 425.32, 421.14, 3200000000000L, 22156000L,
                        "Microsoft develops, manufactures, licenses, and supports software, services, and devices."),
                buildStock("GOOGL", "Alphabet Inc.", "Communication Services", 165.48, 164.25, 2050000000000L, 18234000L,
                        "Alphabet Inc. offers various products and platforms in the United States, Europe, and internationally."),
                buildStock("AMZN", "Amazon.com, Inc.", "Consumer Discretionary", 182.64, 180.92, 1950000000000L, 34567000L,
                        "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions."),
                buildStock("NVDA", "NVIDIA Corporation", "Technology", 945.50, 936.20, 2300000000000L, 45678000L,
                        "NVIDIA Corporation provides graphics, and compute and networking solutions."),
                buildStock("TSLA", "Tesla, Inc.", "Consumer Discretionary", 167.90, 171.25, 540000000000L, 98456000L,
                        "Tesla, Inc. designs, develops, manufactures, and sells electric vehicles."),
                buildStock("META", "Meta Platforms, Inc.", "Communication Services", 512.80, 505.90, 1300000000000L, 16789000L,
                        "Meta Platforms, Inc. builds technologies that help people connect, find communities, and grow businesses."),
                buildStock("JPM", "JPMorgan Chase & Co.", "Financial Services", 198.40, 196.80, 570000000000L, 8900000L,
                        "JPMorgan Chase & Co. operates as a financial services company worldwide."),
                buildStock("V", "Visa Inc.", "Financial Services", 285.54, 282.15, 610000000000L, 5234000L,
                        "Visa Inc. operates as a payments technology company worldwide."),
                buildStock("JNJ", "Johnson & Johnson", "Healthcare", 159.32, 158.75, 420000000000L, 3456000L,
                        "Johnson & Johnson researches and develops, manufactures, and sells pharmaceutical products."),
                buildStock("WMT", "Walmart Inc.", "Consumer Discretionary", 92.18, 90.45, 250000000000L, 7823000L,
                        "Walmart Inc. engages in the operation of retail, wholesale, and other units worldwide."),
                buildStock("PG", "Procter & Gamble Company", "Consumer Staples", 169.45, 168.20, 410000000000L, 4567000L,
                        "The Procter & Gamble Company operates as a consumer goods company worldwide.")
        );

        stockRepository.saveAll(starterStocks);
        log.info("Seeded {} default stocks so the trading screens have initial data", starterStocks.size());
    }

    private Stock buildStock(
            String symbol,
            String name,
            String sector,
            double currentPrice,
            double previousPrice,
            long marketCap,
            long volume,
            String description
    ) {
        Stock stock = new Stock();
        stock.setSymbol(symbol);
        stock.setName(name);
        stock.setSector(sector);
        stock.setMarketCap(marketCap);
        stock.setVolume(volume);
        stock.setCurrentPrice(BigDecimal.valueOf(currentPrice));
        stock.setPreviousPrice(BigDecimal.valueOf(previousPrice));
        stock.setDescription(description);
        return stock;
    }
}
