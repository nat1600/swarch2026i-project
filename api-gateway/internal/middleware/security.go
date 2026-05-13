package middleware

import "net/http"

const hstsMaxAge = "max-age=63072000; includeSubDomains" // 2 years

// Security sets defensive HTTP response headers: X-Content-Type-Options,
// X-Frame-Options, and (in production) Strict-Transport-Security.
func Security(inProduction bool) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")

			if inProduction {
				w.Header().Set("Strict-Transport-Security", hstsMaxAge)
			}

			next.ServeHTTP(w, r)
		})
	}
}
