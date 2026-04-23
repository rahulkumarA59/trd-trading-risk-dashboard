package com.trd.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TradeResponse {
    private Long id;
    private Long userId;
    private Long stockId;
    private String stockSymbol;
    private String stockName;
    private String tradeType;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalAmount;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime createdAt;
}
