package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type AuthConfig struct {
	Audience string
	Domain   string
}

type ServiceRoute struct {
	PathPrefix      string   `json:"path_prefix"`
	ServiceName     string   `json:"service_name"`
	AuthExemptPaths []string `json:"auth_exempt_paths,omitempty"`
	TargetURL       string   `json:"-"` // Populate at runtime

}

type GeneralConfig struct {
	Port        string         `json:"-"` // Populate at runtime
	Environment string         `json:"-"` // Populate at runtime
	Auth        AuthConfig     `json:"-"` // Populate at runtime
	Routes      []ServiceRoute `json:"routes"`
}

func (cfg *GeneralConfig) InProduction() bool {
	return cfg.Environment == "production"
}

func Load(path string) (*GeneralConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file %s: %w", path, err)
	}

	// Load config from JSON
	var config GeneralConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("setting config file %w", err)
	}

	// Add port
	port, err := getEnvVariable("PORT")
	if err != nil {
		return nil, err
	}
	config.Port = port

	// Add environment
	environment, err := getEnvVariable("ENVIRONMENT")
	if err != nil {
		return nil, err
	}
	config.Environment = environment

	// Add auth info (domain and audience)
	authAudience, err := getEnvVariable("AUTH0_AUDIENCE")
	if err != nil {
		return nil, err
	}
	authDomain, err := getEnvVariable("AUTH0_DOMAIN")
	if err != nil {
		return nil, err
	}
	config.Auth = AuthConfig{
		Audience: authAudience, Domain: authDomain,
	}

	// Add routes URL
	for i := range config.Routes {
		envKey := "SERVICE_" + strings.ToUpper(config.Routes[i].ServiceName) + "_URL"
		config.Routes[i].TargetURL = os.Getenv(envKey)
		if config.Routes[i].TargetURL == "" {
			return nil, fmt.Errorf("missing env key %s for service name %s", envKey, config.Routes[i].ServiceName)
		}
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
