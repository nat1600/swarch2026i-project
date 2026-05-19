package com.arquisoft.payment.config;

import com.mercadopago.MercadoPagoConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MercadoPagoConfiguration {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.webhook-token}")
    private String webhookToken;

    public MercadoPagoConfiguration() {
        log.info("Inicializando configuración de MercadoPago...");
    }

    @Bean
    public void initMercadoPago() {
        if (accessToken == null || accessToken.isEmpty()) {
            log.warn("MERCADOPAGO_ACCESS_TOKEN no configurado. Usar variable de entorno.");
            return;
        }
        MercadoPagoConfig.setAccessToken(accessToken);
        log.info("MercadoPago SDK inicializado correctamente");
    }

    public String getWebhookToken() {
        return webhookToken;
    }
}
