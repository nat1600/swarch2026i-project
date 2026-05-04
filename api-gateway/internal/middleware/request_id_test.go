package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestID_ReusesExistingID(t *testing.T) {
	existing := "my-existing-id"
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Request-ID", existing)

	RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)

	if got := w.Header().Get("X-Request-ID"); got != existing {
		t.Errorf("response X-Request-ID = %q, want %q", got, existing)
	}
}

func TestRequestID_ReusesExistingIDOnRequest(t *testing.T) {
	existing := "my-existing-id"
	var captured string
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Request-ID", existing)

	RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured = r.Header.Get("X-Request-ID")
	})).ServeHTTP(w, r)

	if captured != existing {
		t.Errorf("request X-Request-ID = %q, want %q", captured, existing)
	}
}

func TestRequestID_GeneratesNewIDWhenMissing(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)

	RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)

	if got := w.Header().Get("X-Request-ID"); got == "" {
		t.Error("X-Request-ID should be generated when not provided, got empty string")
	}
}

func TestRequestID_GeneratedIDSetOnBothRequestAndResponse(t *testing.T) {
	var requestID string
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)

	RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID = r.Header.Get("X-Request-ID")
	})).ServeHTTP(w, r)

	responseID := w.Header().Get("X-Request-ID")

	if requestID == "" {
		t.Error("X-Request-ID not set on request")
	}
	if responseID == "" {
		t.Error("X-Request-ID not set on response")
	}
	if requestID != responseID {
		t.Errorf("request ID %q != response ID %q", requestID, responseID)
	}
}
