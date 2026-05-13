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

// Auth returns a middleware that validates an Auth0-issued RS256 JWT
// against cfg's issuer and audience, and forwards the token's subject
// to upstream services in the X-User-Sub header. Requests with an
// invalid or missing token are rejected with 401.
func Auth(cfg config.AuthConfig) (Middleware, error) {
	issuerURL, err := url.Parse("https://" + cfg.Domain + "/")
	if err != nil {
		return nil, err
	}

	provider, err := jwks.NewCachingProvider(
		jwks.WithIssuerURL(issuerURL),
		jwks.WithCacheTTL(5*time.Minute),
	)
	if err != nil {
		return nil, err
	}

	jwtValidator, err := validator.New(
		validator.WithKeyFunc(provider.KeyFunc),
		validator.WithAlgorithm(validator.RS256),
		validator.WithAllowedClockSkew(30*time.Second),
		validator.WithIssuer(issuerURL.String()),
		validator.WithAudience(cfg.Audience),
	)
	if err != nil {
		return nil, err
	}

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
		return jwtMiddleware.CheckJWT(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := jwtmiddleware.GetClaims[*validator.ValidatedClaims](r.Context())
			if err != nil {
				// CheckJWT should guarantee claims are present; fail closed if not.
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
