package middleware

import (
	"net/http"
)

const preflightMaxAge = "86400" // 24h

// CORS sets the CORS headers and short-circuits OPTIONS preflight
// requests with 204 so they never reach upstream services.
func CORS(allowedOrigins string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigins)

			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				w.Header().Set("Access-Control-Max-Age", preflightMaxAge)
				w.WriteHeader(http.StatusNoContent)
				return
			}

			w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")
			next.ServeHTTP(w, r)
		})
	}
}
