package com.swarch2026i.apigateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import org.junit.jupiter.api.Test;

class RouteConfigTests {

    @Test
    void normalizeServiceUrlTrimsWhitespace() {
        String normalizedUrl = RouteConfig.normalizeServiceUrl("services.auth-url", "  http://auth_service:8000  ");

        assertThat(normalizedUrl).isEqualTo("http://auth_service:8000");
    }

    @Test
    void normalizeServiceUrlRejectsBlankValues() {
        assertThatIllegalStateException()
                .isThrownBy(() -> RouteConfig.normalizeServiceUrl("services.auth-url", "   "))
                .withMessageContaining("services.auth-url")
                .withMessageContaining("Missing required gateway target URL");
    }

    @Test
    void normalizeServiceUrlRejectsMalformedUris() {
        assertThatIllegalStateException()
                .isThrownBy(() -> RouteConfig.normalizeServiceUrl("services.auth-url", "http:"))
                .withMessageContaining("services.auth-url")
                .withMessageContaining("http:");
    }
}