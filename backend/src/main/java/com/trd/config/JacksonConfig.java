package com.trd.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Jackson configuration for proper serialization/deserialization of Java 8 date/time types.
 * Fixes: "Java 8 date/time type java.time.LocalDateTime not supported by default"
 *
 * This configuration:
 * 1. Registers JavaTimeModule for LocalDateTime support
 * 2. Sets standard date/time formatting (yyyy-MM-dd HH:mm:ss)
 * 3. Configures both the main ObjectMapper and HTTP message converters
 * 4. Handles serialization and deserialization
 */
@Configuration
public class JacksonConfig {

    /**
     * Date/time formatter pattern for LocalDateTime serialization/deserialization.
     */
    private static final String DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss";

    /**
     * Creates a primary ObjectMapper bean with Java 8 date/time support.
     * This is used wherever @Autowired ObjectMapper is injected.
     *
     * @return configured ObjectMapper instance
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATE_TIME_PATTERN);

        JavaTimeModule javaTimeModule = new JavaTimeModule();
        // Register LocalDateTime serializer with specific format
        javaTimeModule.addSerializer(
            LocalDateTime.class,
            new LocalDateTimeSerializer(dateTimeFormatter)
        );

        ObjectMapper mapper = new ObjectMapper();

        // Register the Java 8 date/time module
        mapper.registerModule(javaTimeModule);

        // Serialization settings
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        // Deserialization settings
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE, false);

        // Include settings - only include non-null properties
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        return mapper;
    }

    /**
     * Configures Jackson2HttpMessageConverter with proper date/time formatting.
     * This is critical for Spring REST API responses.
     *
     * @param objectMapper the configured ObjectMapper
     * @return configured MappingJackson2HttpMessageConverter
     */
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(
            ObjectMapper objectMapper) {
        return new MappingJackson2HttpMessageConverter(objectMapper);
    }

    /**
     * Alternative ObjectMapper builder configuration using Jackson2ObjectMapperBuilder.
     * Provides a fluent way to configure Jackson with Java 8 date/time support.
     *
     * @return configured Jackson2ObjectMapperBuilder
     */
    @Bean
    public Jackson2ObjectMapperBuilder jackson2ObjectMapperBuilder() {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();

        // Register Java 8 date/time module
        builder.modules(new JavaTimeModule());

        // Date/time formatting
        builder.serializers(new LocalDateTimeSerializer(
            DateTimeFormatter.ofPattern(DATE_TIME_PATTERN)
        ));

        // Serialization configuration
        builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        builder.featuresToDisable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

        // Deserialization configuration
        builder.featuresToDisable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        builder.featuresToDisable(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE);

        // Include non-null values only
        builder.serializationInclusion(JsonInclude.Include.NON_NULL);

        return builder;
    }
}

