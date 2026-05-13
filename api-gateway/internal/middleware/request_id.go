package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

const requestIDByteLen = 16 // 128 bits

// RequestID propagates the X-Request-ID header end-to-end, generating
// a new one when the incoming request does not already carry it. The
// value is written to both the request (for upstream) and the response
// (for the client).
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = generateID()
		}

		w.Header().Set("X-Request-ID", id)
		r.Header.Set("X-Request-ID", id)

		next.ServeHTTP(w, r)
	})
}

func generateID() string {
	bytes := make([]byte, requestIDByteLen)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
