package com.arquisoft.payment.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookPayloadDTO {

    private String id;
    private String type;
    private String action;
    private Data data;

    @lombok.Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Data {
        private String id;

        @JsonAnySetter
        private Map<String, Object> additionalProperties = new HashMap<>();
    }
}
