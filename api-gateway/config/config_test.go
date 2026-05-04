package config

import (
	"os"
	"path/filepath"
	"testing"
)

// writeConfigFile creates a temporary JSON config file in dir and returns its path.
func writeConfigFile(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write temp config file: %v", err)
	}
	return path
}

// setRequiredEnvVars sets all env vars that Load() requires (except SERVICE_*_URL).
func setRequiredEnvVars(t *testing.T) {
	t.Helper()
	t.Setenv("PORT", "8080")
	t.Setenv("ENVIRONMENT", "staging")
	t.Setenv("AUTH0_AUDIENCE", "test-audience")
	t.Setenv("AUTH0_DOMAIN", "test.auth0.com")
}

// --- Load() ---

func TestLoad_ValidConfig(t *testing.T) {
	path := writeConfigFile(t, `{"routes":[{"path_prefix":"/api/auth","service_name":"auth"}]}`)

	setRequiredEnvVars(t)
	t.Setenv("SERVICE_AUTH_URL", "http://auth-service:8081")

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}

	if cfg.Port != "8080" {
		t.Errorf("Port: want %q, got %q", "8080", cfg.Port)
	}
	if cfg.Environment != "staging" {
		t.Errorf("Environment: want %q, got %q", "staging", cfg.Environment)
	}
	if cfg.Auth.Audience != "test-audience" {
		t.Errorf("Auth.Audience: want %q, got %q", "test-audience", cfg.Auth.Audience)
	}
	if cfg.Auth.Domain != "test.auth0.com" {
		t.Errorf("Auth.Domain: want %q, got %q", "test.auth0.com", cfg.Auth.Domain)
	}
	if len(cfg.Routes) != 1 {
		t.Fatalf("Routes: want 1 route, got %d", len(cfg.Routes))
	}
	if cfg.Routes[0].PathPrefix != "/api/auth" {
		t.Errorf("Routes[0].PathPrefix: want %q, got %q", "/api/auth", cfg.Routes[0].PathPrefix)
	}
	if cfg.Routes[0].ServiceName != "auth" {
		t.Errorf("Routes[0].ServiceName: want %q, got %q", "auth", cfg.Routes[0].ServiceName)
	}
	if cfg.Routes[0].TargetURL != "http://auth-service:8081" {
		t.Errorf("Routes[0].TargetURL: want %q, got %q", "http://auth-service:8081", cfg.Routes[0].TargetURL)
	}
}

func TestLoad_MissingJSONFile(t *testing.T) {
	setRequiredEnvVars(t)

	_, err := Load("/nonexistent/path/config.json")
	if err == nil {
		t.Error("Load() should return an error when the JSON file does not exist")
	}
}

func TestLoad_MissingPORTEnvVar(t *testing.T) {
	path := writeConfigFile(t, `{"routes":[{"path_prefix":"/api/auth","service_name":"auth"}]}`)

	// Set everything except PORT
	t.Setenv("ENVIRONMENT", "staging")
	t.Setenv("AUTH0_AUDIENCE", "test-audience")
	t.Setenv("AUTH0_DOMAIN", "test.auth0.com")
	t.Setenv("SERVICE_AUTH_URL", "http://auth-service:8081")

	_, err := Load(path)
	if err == nil {
		t.Error("Load() should return an error when PORT is not set")
	}
}

func TestLoad_MissingServiceURL(t *testing.T) {
	path := writeConfigFile(t, `{"routes":[{"path_prefix":"/api/auth","service_name":"auth"}]}`)

	setRequiredEnvVars(t)
	// SERVICE_AUTH_URL is intentionally not set

	_, err := Load(path)
	if err == nil {
		t.Error("Load() should return an error when SERVICE_AUTH_URL is missing")
	}
}

// --- InProduction() ---

func TestInProduction_ReturnsTrueInProduction(t *testing.T) {
	cfg := &GeneralConfig{Environment: "production"}
	if !cfg.InProduction() {
		t.Error("InProduction() should return true when Environment is \"production\"")
	}
}

func TestInProduction_ReturnsFalseInStaging(t *testing.T) {
	cfg := &GeneralConfig{Environment: "staging"}
	if cfg.InProduction() {
		t.Error("InProduction() should return false when Environment is \"staging\"")
	}
}
