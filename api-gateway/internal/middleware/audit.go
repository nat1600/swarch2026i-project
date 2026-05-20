package middleware

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
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



// notifySlack send an alert message into the webhook

func notifySlack(actor, path, method string, status int) {
	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	if webhookURL == "" {
		return
	}

	message := map[string]string{
		"text": " *Security Alert — Parla Gateway*\n" +
			"*Actor:* " + actor + "\n" +
			"*Method:* " + method + "\n" +
			"*Path:* " + path + "\n" +
			"*Status:* " + http.StatusText(status) + "\n" +
			"*Timestamp:* " + time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(message)
	if err != nil {
		slog.Error("failed to marshal slack message", "error", err)
		return
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		slog.Error("failed to send slack alert", "error", err)
		return
	}
	defer resp.Body.Close()
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

		// send slack for blocked or unautho
		if rr.statusCode == http.StatusBadRequest ||
			rr.statusCode == http.StatusUnauthorized {
			go notifySlack(actor, r.URL.Path, r.Method, rr.statusCode)
		}
	})
}