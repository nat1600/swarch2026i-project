// Package config loads gateway configuration from a JSON file and
// environment variables, and merges them into a single GeneralConfig.
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// AuthConfig holds the Auth0 parameters used by the JWT validator.
type AuthConfig struct {
	Audience string
	Domain   string
}

// ServiceRoute describes a single upstream microservice route.
// TargetURL is populated at load time from SERVICE_<NAME>_URL.
type ServiceRoute struct {
	PathPrefix  string `json:"path_prefix"`
	ServiceName string `json:"service_name"`
	TargetURL   string `json:"-"`
}

// GeneralConfig is the fully resolved gateway configuration.
// Fields tagged json:"-" come from environment variables, not the file.
type GeneralConfig struct {
	Port           string         `json:"-"`
	Environment    string         `json:"-"`
	AllowedOrigins string         `json:"-"`
	Auth           AuthConfig     `json:"-"`
	Routes         []ServiceRoute `json:"routes"`
}

// InProduction reports whether the gateway is running with ENVIRONMENT=production.
func (cfg *GeneralConfig) InProduction() bool {
	return cfg.Environment == "production"
}

// Load reads the JSON configuration at path and merges in the required
// environment variables (PORT, ENVIRONMENT, AUTH0_AUDIENCE, AUTH0_DOMAIN,
// ALLOWED_ORIGINS, and SERVICE_<NAME>_URL for each route). It returns an
// error if any required variable is missing.
func Load(path string) (*GeneralConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file %s: %w", path, err)
	}

	var config GeneralConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("parsing config file: %w", err)
	}

	port, err := getEnvVariable("PORT")
	if err != nil {
		return nil, err
	}
	config.Port = port

	environment, err := getEnvVariable("ENVIRONMENT")
	if err != nil {
		return nil, err
	}
	config.Environment = environment

	authAudience, err := getEnvVariable("AUTH0_AUDIENCE")
	if err != nil {
		return nil, err
	}
	authDomain, err := getEnvVariable("AUTH0_DOMAIN")
	if err != nil {
		return nil, err
	}
	config.Auth = AuthConfig{
		Audience: authAudience,
		Domain:   authDomain,
	}

	allowedOrigins, err := getEnvVariable("ALLOWED_ORIGINS")
	if err != nil {
		return nil, err
	}
	config.AllowedOrigins = allowedOrigins

	for i := range config.Routes {
		envKey := "SERVICE_" + strings.ToUpper(config.Routes[i].ServiceName) + "_URL"
		envValue, err := getEnvVariable(envKey)
		if err != nil {
			return nil, err
		}
		config.Routes[i].TargetURL = envValue
	}
	return &config, nil
}

func getEnvVariable(envVariableName string) (string, error) {
	variable := os.Getenv(envVariableName)
	if variable == "" {
		return "", fmt.Errorf("missing env variable: %s", envVariableName)
	}
	return variable, nil
}
