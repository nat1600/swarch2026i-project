// Package router builds the gateway's http.ServeMux, registering one
// reverse-proxy handler per configured route plus health and 404 handlers.
package router

import (
	"api-gateway/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

const (
	defaultRPS         = 10.0
	defaultBurst       = 20
	healthProbeTimeout = 2 * time.Second
)

// New builds the gateway's HTTP handler: a reverse proxy per route in
// cfg.Routes (authenticated), plus /health, /health/detailed and a JSON
// 404 fallback (all unauthenticated).
func New(cfg *config.GeneralConfig) (*http.ServeMux, error) {
	mux := http.NewServeMux()

	authMiddleware, err := middleware.Auth(cfg.Auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth middleware: %w", err)
	}

	baseMiddlewares := []middleware.Middleware{
		middleware.RequestID,
		middleware.Logging,
		middleware.CORS(cfg.AllowedOrigins),
		middleware.RateLimit(defaultRPS, defaultBurst),
	}
	middlewaresWithAuth := append(baseMiddlewares, authMiddleware, middleware.InputValidator)
	middlewaresWithoutAuth := baseMiddlewares

	for _, route := range cfg.Routes {
		prx, err := proxy.New(route.TargetURL, route.PathPrefix)
		if err != nil {
			return nil, fmt.Errorf("failed to create proxy for %s: %w", route.PathPrefix, err)
		}
		handler := middleware.Chain(prx, middlewaresWithAuth...)
		mux.Handle(route.PathPrefix+"/", handler)
	}

	mux.Handle("GET /health", middleware.Chain(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), middlewaresWithoutAuth...))

	detailedHealthHandler := middleware.Chain(getDetailedHealthHandler(cfg), middlewaresWithoutAuth...)
	mux.Handle("GET /health/detailed", detailedHealthHandler)

	notFoundHandler := middleware.Chain(getNotFoundHandler(), middlewaresWithoutAuth...)
	mux.Handle("/", notFoundHandler)

	return mux, nil
}

// getDetailedHealthHandler probes every upstream's /health concurrently
// and returns a JSON map of {service: "OK" | "NOT OK"}. Responds with
// 503 if any probe fails.
func getDetailedHealthHandler(cfg *config.GeneralConfig) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		status := map[string]string{}
		allHealthy := true
		var wg sync.WaitGroup
		var mu sync.Mutex

		for _, route := range cfg.Routes {
			wg.Add(1)
			go func(r config.ServiceRoute) {
				defer wg.Done()
				serviceOk, serviceError := checkService(r.TargetURL + "/health")
				mu.Lock()
				defer mu.Unlock()

				if serviceOk {
					status[r.ServiceName] = "OK"
				} else {
					status[r.ServiceName] = "NOT OK"
					slog.Error("failed health check", "service", r.ServiceName, "error", serviceError)
					allHealthy = false
				}
			}(route)
		}
		wg.Wait()

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
		if err := json.NewEncoder(w).Encode(map[string]string{"error": "Not found"}); err != nil {
			slog.Error("failed to encode response", "error", err)
		}
	})
}

// checkService issues a short-timeout GET to a service's /health URL.
// A service is considered healthy when the response status is below 500.
func checkService(url string) (bool, string) {
	client := &http.Client{Timeout: healthProbeTimeout}
	resp, err := client.Get(url)
	if err != nil {
		return false, err.Error()
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		body = []byte("failed to read response body: " + err.Error())
	}
	return resp.StatusCode < 500, string(body)
}
