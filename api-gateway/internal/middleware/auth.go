package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v3"
	"github.com/auth0/go-jwt-middleware/v3/jwks"
	"github.com/auth0/go-jwt-middleware/v3/validator"

	"api-gateway/config"
)

func Auth(cfg config.AuthConfig) (Middleware, error) {
	issuerURL, err := url.Parse("https://" + cfg.Domain + "/")
	if err != nil {
		return nil, err
	}

	// Initialize JWKS provider
	provider, err := jwks.NewCachingProvider(
		jwks.WithIssuerURL(issuerURL),
		jwks.WithCacheTTL(5*time.Minute),
	)
	if err != nil {
		return nil, err
	}

	// Create validator
	jwtValidator, err := validator.New(
		validator.WithKeyFunc(provider.KeyFunc),        // Provides public keys for RS256
		validator.WithAlgorithm(validator.RS256),       // Algorithm (prevents confusion attacks)
		validator.WithAllowedClockSkew(30*time.Second), // Allows 30s clock drift
		validator.WithIssuer(issuerURL.String()),       // Validates 'iss' claim
		validator.WithAudience(cfg.Audience),           // Validates 'aud' claim
	)
	if err != nil {
		return nil, err
	}

	// Wraps it into an actual HTTP middleware with custom error handler
	jwtMiddleware, err := jwtmiddleware.New(
		jwtmiddleware.WithValidator(jwtValidator),
		jwtmiddleware.WithErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
			slog.Error("JWT validation failed", "error", err, "path", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			if err := json.NewEncoder(w).Encode(map[string]string{"error": "Failed to validate JWT"}); err != nil {
				slog.Error("failed to encode response", "error", err)
			}
		}),
	)
	if err != nil {
		return nil, err
	}

	return func(next http.Handler) http.Handler {

		// CheckJWT extracts and validates the token, and put the validated claims
		return jwtMiddleware.CheckJWT(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// Set the user-sub header from the claims
			claims, err := jwtmiddleware.GetClaims[*validator.ValidatedClaims](r.Context())
			if err != nil { // should never happen - CheckJWT guarantees claims are set
				slog.Error("missing claims", "error", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				if err := json.NewEncoder(w).Encode(map[string]string{"error": "Error during authentication"}); err != nil {
					slog.Error("failed to encode response", "error", err)
				}
				return
			}
			r.Header.Set("X-User-Sub", claims.RegisteredClaims.Subject)
			next.ServeHTTP(w, r)
		}))
	}, nil
}
