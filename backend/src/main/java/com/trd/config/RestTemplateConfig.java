package com.trd.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for RestTemplate bean.
 * Provides centralized RestTemplate configuration with timeout settings.
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Creates a RestTemplate bean with timeout configurations driven by application properties.
     *
     * @param builder RestTemplateBuilder for building RestTemplate
     * @return configured RestTemplate instance with proper Jackson handling
     */
    @Bean
    public RestTemplate restTemplate(
            RestTemplateBuilder builder,
            @Value("${stock.api.timeout:5000}") long timeoutMs
    ) {
        Duration timeout = Duration.ofMillis(timeoutMs);
        return builder
                .setConnectTimeout(timeout)
                .setReadTimeout(timeout)
                .build();
    }
}


