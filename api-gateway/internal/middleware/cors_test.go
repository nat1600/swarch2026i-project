package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS_SetsHeadersOnEveryRequest(t *testing.T) {
	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions}
	for _, method := range methods {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(method, "/", nil)
		CORS("https://example.com")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)

		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://example.com" {
			t.Errorf("method=%s: Access-Control-Allow-Origin = %q, want %q", method, got, "https://example.com")
		}
		if got := w.Header().Get("Access-Control-Allow-Methods"); got == "" {
			t.Errorf("method=%s: Access-Control-Allow-Methods should not be empty", method)
		}
		if got := w.Header().Get("Access-Control-Allow-Headers"); got == "" {
			t.Errorf("method=%s: Access-Control-Allow-Headers should not be empty", method)
		}
		if got := w.Header().Get("Access-Control-Max-Age"); got == "" {
			t.Errorf("method=%s: Access-Control-Max-Age should not be empty", method)
		}
	}
}

func TestCORS_OptionsReturns204AndDoesNotCallNext(t *testing.T) {
	called := false
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodOptions, "/", nil)
	CORS("*")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})).ServeHTTP(w, r)

	if w.Code != http.StatusNoContent {
		t.Errorf("OPTIONS: status = %d, want %d", w.Code, http.StatusNoContent)
	}
	if called {
		t.Error("OPTIONS: next handler should not be called")
	}
}

func TestCORS_NonOptionsCallsNext(t *testing.T) {
	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete}
	for _, method := range methods {
		called := false
		w := httptest.NewRecorder()
		r := httptest.NewRequest(method, "/", nil)
		CORS("*")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
		})).ServeHTTP(w, r)

		if !called {
			t.Errorf("method=%s: next handler was not called", method)
		}
	}
}
