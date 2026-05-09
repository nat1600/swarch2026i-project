package router

import (
	"api-gateway/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

func New(cfg *config.GeneralConfig) (*http.ServeMux, error) {
	mux := http.NewServeMux()

	// Create auth middleware
	authMiddleware, err := middleware.Auth(cfg.Auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth middleware %w", err)
	}

	// Middlewares
	baseMiddlewares := []middleware.Middleware{
		middleware.Security(cfg.InProduction()),
		middleware.RequestID,
		middleware.Logging,
		middleware.CORS(cfg.AllowedOrigins),
		middleware.RateLimit(10, 20),
	}
	middlewaresWithAuth := append(baseMiddlewares, authMiddleware)
	middlewaresWithoutAuth := baseMiddlewares

	// Register a proxy for each route
	for _, route := range cfg.Routes {
		prx, err := proxy.New(route.TargetURL, route.PathPrefix)
		if err != nil {
			return nil, fmt.Errorf("failed to create proxy for %s: %w", route.PathPrefix, err)
		}
		handler := middleware.Chain(prx, middlewaresWithAuth...)
		mux.Handle(route.PathPrefix+"/", handler)
	}

	// General health check: includes this api gateway and the microservices
	healthProxy := middleware.Chain(getHealthHandler(cfg), middlewaresWithoutAuth...)
	mux.Handle("GET /health", healthProxy)

	// Add base handler for / , used when the given route does not match with any on the mux table
	notFoundHandler := middleware.Chain(getNotFoundHandler(), middlewaresWithoutAuth...)
	mux.Handle("/", notFoundHandler)

	return mux, nil
}

func getHealthHandler(cfg *config.GeneralConfig) http.Handler {
	// General health check: includes this api gateway and the microservices
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		status := map[string]string{}
		allHealthy := true

		for _, route := range cfg.Routes {
			if CheckService(route.TargetURL + "/health") {
				status[route.ServiceName] = "OK"
			} else {
				status[route.ServiceName] = "NOT OK"
				allHealthy = false
			}
		}

		w.Header().Set("Content-Type", "application/json")
		if !allHealthy {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		if err := json.NewEncoder(w).Encode(status); err != nil {
			slog.Error("failed to encode response", "error", err)
		}
	})
}

func getNotFoundHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		if err := json.NewEncoder(w).Encode("Not found"); err != nil {
			slog.Error("failed to encode response", "error", err)
		}
	})
}

func CheckService(url string) bool {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode < 500

}
