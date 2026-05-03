package middleware

import (
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
		validator.WithIssuer(issuerURL.String()),
		validator.WithAudience(cfg.Audience),
	)
	if err != nil {
		return nil, err
	}

	jwtMiddleware, err := jwtmiddleware.New(
		jwtmiddleware.WithValidator(jwtValidator),
	)
	if err != nil {
		return nil, err
	}

	return func(next http.Handler) http.Handler {
		// CheckJWT valida el token y pone claims en el context
		return jwtMiddleware.CheckJWT(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extraer claims del context
			claims, err := jwtmiddleware.GetClaims[*validator.ValidatedClaims](r.Context())
			if err == nil {
				r.Header.Set("X-User-Sub", claims.RegisteredClaims.Subject)
			}

			next.ServeHTTP(w, r)
		}))
	}, nil
}
