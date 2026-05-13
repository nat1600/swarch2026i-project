package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// responseRecorder captures the status code written by the inner
// handler so it can be logged after the handler returns.
type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.statusCode = code
	rr.ResponseWriter.WriteHeader(code)
}

// Logging emits one structured log line per request including method,
// path, status, duration, and request ID.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rr := &responseRecorder{
			statusCode:     http.StatusOK,
			ResponseWriter: w,
		}

		next.ServeHTTP(rr, r)

		slog.Info(
			"REQUEST",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rr.statusCode,
			"duration", time.Since(start).String(),
			"request_id", r.Header.Get("X-Request-ID"),
		)
	})
}
