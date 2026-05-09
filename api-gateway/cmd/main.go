package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

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

	// Set server with the mux provided by the router
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	// Create a context that is canceled by Ctrl+C or SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Start the server in a goroutine
	go func() {
		logInitialStatus(server, cfg)
		if err = server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	// Wait until the stop signal
	<-ctx.Done()
	log.Println("shutting down gracefully...")

	// 10 seconds left to complete pending requests
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("server stopped")

}

func logInitialStatus(server *http.Server, cfg *config.GeneralConfig) {
	log.Printf("────────────────────────────────────────────────────────────────")
	log.Println("API Gateway listening on", server.Addr)
	log.Println("Registered services:")
	log.Printf("  %-10s %-15s   %s  %21s", "SERVICE", "PATH", "TARGET", "HEALTH")
	log.Printf("  %-10s %-15s   %s  %21s", "───────", "────", "──────", "──────")
	for _, route := range cfg.Routes {
		isHealthy, _ := router.CheckService(route.TargetURL + "/health")
		status := "OK"
		if !isHealthy {
			status = "NOT OK"
		}
		log.Printf("  %-10s %-15s → %s  %s", route.ServiceName, route.PathPrefix, route.TargetURL, status)
	}
	log.Printf("────────────────────────────────────────────────────────────────")
}
