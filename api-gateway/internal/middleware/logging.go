package middleware

import (
	"log/slog"
	"net/http"
)

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		next.ServeHTTP(w, r)

		// Structure logging
		slog.Info(
			"request",
			"method", r.Method,
			"path", r.URL.Path,
			"request_id", r.Header.Get("X-Request-ID"),
		)
	})
}
