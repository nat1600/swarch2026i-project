package com.swarch2026i.apigateway;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    RouteLocator gatewayRoutes(
            RouteLocatorBuilder builder,
            @Value("${services.auth-url}") String authUrl,
            @Value("${services.core-url}") String coreUrl,
            @Value("${services.forum-url}") String forumUrl,
            @Value("${services.game-url}") String gameUrl
    ) {
        URI normalizedAuthUrl = toGatewayUri("services.auth-url", authUrl);
        URI normalizedCoreUrl = toGatewayUri("services.core-url", coreUrl);
        URI normalizedForumUrl = toGatewayUri("services.forum-url", forumUrl);
        URI normalizedGameUrl = toGatewayUri("services.game-url", gameUrl);

        return builder.routes()
                .route("auth-service", route -> route
                        .path("/api/auth/**")
                        .filters(filter -> filter.rewritePath("/api/auth/?(?<remaining>.*)", "/${remaining}"))
                        .uri(normalizedAuthUrl))
                .route("core-service", route -> route
                        .path("/api/core/**")
                        .filters(filter -> filter.rewritePath("/api/core/?(?<remaining>.*)", "/${remaining}"))
                        .uri(normalizedCoreUrl))
                .route("forum-service", route -> route
                        .path("/api/forum/**")
                        .filters(filter -> filter.rewritePath("/api/forum/?(?<remaining>.*)", "/${remaining}"))
                        .uri(normalizedForumUrl))
                .route("gamification-service", route -> route
                        .path("/api/game/**")
                        .filters(filter -> filter.rewritePath("/api/game/?(?<remaining>.*)", "/${remaining}"))
                        .uri(normalizedGameUrl))
                .build();
    }

    static String normalizeServiceUrl(String propertyName, String rawUrl) {
        if (rawUrl == null) {
            throw new IllegalStateException("Missing required gateway target URL for " + propertyName);
        }

        String normalizedUrl = rawUrl.trim();
        if (normalizedUrl.isBlank()) {
            throw new IllegalStateException("Missing required gateway target URL for " + propertyName);
        }

        try {
            URI uri = URI.create(normalizedUrl);
            if (uri.getScheme() == null || uri.getRawAuthority() == null || uri.getRawAuthority().isBlank()) {
                throw new IllegalArgumentException("URI must include scheme and authority");
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Invalid gateway target URL for " + propertyName + ": " + normalizedUrl,
                    exception
            );
        }

        return normalizedUrl.endsWith("/") ? normalizedUrl.substring(0, normalizedUrl.length() - 1) : normalizedUrl;
    }

    private static URI toGatewayUri(String propertyName, String rawUrl) {
        try {
            return URI.create(normalizeServiceUrl(propertyName, rawUrl));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Invalid gateway target URL for " + propertyName + ": " + rawUrl,
                    exception
            );
        }
    }
}