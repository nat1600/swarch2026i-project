package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use X-Request-ID if available
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = generateID()
		}

		// Propagate it to the microservice and also add it to the response
		w.Header().Set("X-Request-ID", id)
		r.Header.Set("X-Request-ID", id)

		next.ServeHTTP(w, r)
	})
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
