package com.arquisoft.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDTO {

    @JsonProperty("external_reference")
    private String externalReference;

    @JsonProperty("payer_email")
    private String payerEmail;

    @JsonProperty("items")
    private List<PaymentItemDTO> items;

    @JsonProperty("back_urls")
    private BackUrlsDTO backUrls;

    @JsonProperty("notification_url")
    private String notificationUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentItemDTO {
        private String id;
        private String title;
        private String description;
        private Integer quantity;
        @JsonProperty("unit_price")
        private Double unitPrice;
        private String currency;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BackUrlsDTO {
        private String success;
        private String failure;
        private String pending;
    }
}
