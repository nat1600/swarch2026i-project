package router

import (
	"api-gateway/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func New(cfg *config.GeneralConfig) (*http.ServeMux, error) {
	mux := http.NewServeMux()

	// General health check: includes this api gateway and the microservices
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
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
		json.NewEncoder(w).Encode(status)
	})

	// Create auth middleware
	authMiddleware, err := middleware.Auth(cfg.Auth)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth middleware %w", err)
	}

	// Middlewares
	middlewares := []middleware.Middleware{
		middleware.Security(cfg.InProduction()),
		middleware.RequestID,
		middleware.Logging,
		middleware.CORS("http://localhost:3000"),
		middleware.RateLimit(10, 20),
		authMiddleware,
	}

	// Register a proxy for each route
	for _, route := range cfg.Routes {
		prx, err := proxy.New(route.TargetURL, route.PathPrefix)
		if err != nil {
			return nil, fmt.Errorf("failed to create proxy for %s: %w", route.PathPrefix, err)
		}
		handler := middleware.Chain(prx, middlewares...)
		mux.Handle(route.PathPrefix+"/", handler)
	}

	return mux, nil
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
