package com.swarch2026i.apigateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * Global filter that extracts the authenticated user's "sub" claim from the
 * validated JWT and forwards it to downstream services as the X-User-Sub header.
 *
 * Any X-User-Sub header sent by the client is stripped first to prevent spoofing.
 */
@Component
public class JwtRelayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> {
                    Jwt jwt = (Jwt) ctx.getAuthentication().getPrincipal();
                    String sub = jwt.getClaimAsString("sub");

                    ServerHttpRequest request = exchange.getRequest().mutate()
                            .headers(headers -> headers.remove("X-User-Sub"))
                            .header("X-User-Sub", sub)
                            .build();

                    return exchange.mutate().request(request).build();
                })
                .defaultIfEmpty(exchange)
                .flatMap(chain::filter);
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
