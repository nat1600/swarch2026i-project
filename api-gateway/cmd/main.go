// Command api-gateway is the entry point for the reverse-proxy gateway.
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

const shutdownTimeout = 10 * time.Second

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatalf("error loading .env file: %v", err)
	}

	cfg, err := config.Load("config.json")
	if err != nil {
		log.Fatalf("failed to load config file: %v", err)
	}

	mux, err := router.New(cfg)
	if err != nil {
		log.Fatalf("failed to create router: %v", err)
	}

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		logInitialStatus(server, cfg)
		// http.ErrServerClosed is the expected error after Shutdown.
		if err = server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
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
	log.Printf("  %-10s %-15s   %s", "SERVICE", "PATH", "TARGET")
	log.Printf("  %-10s %-15s   %s", "───────", "────", "──────")
	for _, route := range cfg.Routes {
		log.Printf("  %-10s %-15s → %s", route.ServiceName, route.PathPrefix, route.TargetURL)
	}
	log.Printf("────────────────────────────────────────────────────────────────")
}
