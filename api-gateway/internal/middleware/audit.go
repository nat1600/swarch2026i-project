package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"time"
)

var sensitiveEndpoints = []string{
	"/api/core/phrases",
	"/api/payments",
	"/api/auth/graphql",
	"/api/forum/posts",
	"/api/core/translate", 
}


var AuditInterceptor Middleware = func(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {


    //  reviwe if is a sensitive endpoint


	isSensitive := false
		for _, endpoint := range sensitiveEndpoints {
			if strings.HasPrefix(r.URL.Path, endpoint) {
				isSensitive = true
				break
			}
		}

	// If not sensitive, skip and go aheadd :)

	if !isSensitive {
			next.ServeHTTP(w, r)
			return
		}


	// see who is the actor from the x-user-sun header
	actor := r.Header.Get("X-User-Sub")
		if actor == "" {
			actor = "anonymous"
		}

		
	rr := &responseRecorder{
			statusCode:     http.StatusOK,
			ResponseWriter: w,
		}


	next.ServeHTTP(rr, r)


	slog.Info(
			"AUDIT",
			"actor", actor,
			"method", r.Method,
			"path", r.URL.Path,
			"status", rr.statusCode,
			"timestamp", time.Now().UTC().Format(time.RFC3339),
			"request_id", r.Header.Get("X-Request-ID"),
		)

	})
}