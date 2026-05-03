package main

import (
	"errors"
	"log"
	"net/http"

	"api-gateway/config"
	"api-gateway/internal/router"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("error loading .env file: %v", err)
	}

	// Set configuration
	cfg, err := config.Load("config.json")
	if err != nil {
		log.Fatalf("failed to load config file: %v", err)
	}

	// Set router
	mux, err := router.New(cfg)
	if err != nil {
		log.Fatalf("failed to create router: %v", err)
	}

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	//go func() {
	//	log.Printf("API Gateway listening on %s", server.Addr)
	//	if err = server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
	//		log.Fatalf("server failed: %v", err)
	//	}
	//}()

	logInitialStatus(server, cfg)
	if err = server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server failed: %v", err)
	}
}

func logInitialStatus(server *http.Server, cfg *config.GeneralConfig) {
	log.Printf("────────────────────────────────────────────────────────────────")
	log.Println("API Gateway listening on", server.Addr)
	log.Println("Registered services:")
	log.Printf("  %-10s %-15s   %s  %21s", "SERVICE", "PATH", "TARGET", "HEALTH")
	log.Printf("  %-10s %-15s   %s  %21s", "───────", "────", "──────", "──────")
	for _, route := range cfg.Routes {
		isHealthy := router.CheckService(route.TargetURL + "/health")
		status := "OK"
		if !isHealthy {
			status = "NOT OK"
		}
		log.Printf("  %-10s %-15s → %s  %s", route.ServiceName, route.PathPrefix, route.TargetURL, status)
	}
	log.Printf("────────────────────────────────────────────────────────────────")
}
