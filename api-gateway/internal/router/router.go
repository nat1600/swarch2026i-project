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

	// General health check: only this api gateway
	mux.Handle("GET /health", middleware.Chain(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}), middlewaresWithoutAuth...))

	// Detailed health check: includes this api gateway and the microservices
	detailedHealthHandler := middleware.Chain(getDetailedHealthHandler(cfg), middlewaresWithoutAuth...)
	mux.Handle("GET /health/detailed", detailedHealthHandler)

	// Add base handler for / , used when the given route does not match with any on the mux table
	notFoundHandler := middleware.Chain(getNotFoundHandler(), middlewaresWithoutAuth...)
	mux.Handle("/", notFoundHandler)

	return mux, nil
}

func getDetailedHealthHandler(cfg *config.GeneralConfig) http.Handler {
	// General health check: includes this api gateway and the microservices
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

func checkService(url string) (bool, string) {
	client := &http.Client{Timeout: 2 * time.Second}
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
