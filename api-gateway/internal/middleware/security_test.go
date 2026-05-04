package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSecurity_AlwaysSetsXContentTypeOptions(t *testing.T) {
	for _, inProduction := range []bool{true, false} {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		Security(inProduction)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)
		if got := w.Header().Get("X-Content-Type-Options"); got != "nosniff" {
			t.Errorf("inProduction=%v: X-Content-Type-Options = %q, want %q", inProduction, got, "nosniff")
		}
	}
}

func TestSecurity_AlwaysSetsXFrameOptions(t *testing.T) {
	for _, inProduction := range []bool{true, false} {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		Security(inProduction)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)
		if got := w.Header().Get("X-Frame-Options"); got != "DENY" {
			t.Errorf("inProduction=%v: X-Frame-Options = %q, want %q", inProduction, got, "DENY")
		}
	}
}

func TestSecurity_SetsSTSWhenInProduction(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	Security(true)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)
	if got := w.Header().Get("Strict-Transport-Security"); got == "" {
		t.Error("Strict-Transport-Security should be set in production, got empty string")
	}
}

func TestSecurity_DoesNotSetSTSWhenNotInProduction(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	Security(false)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})).ServeHTTP(w, r)
	if got := w.Header().Get("Strict-Transport-Security"); got != "" {
		t.Errorf("Strict-Transport-Security should not be set outside production, got %q", got)
	}
}

func TestSecurity_AlwaysCallsNext(t *testing.T) {
	for _, inProduction := range []bool{true, false} {
		called := false
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		Security(inProduction)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
		})).ServeHTTP(w, r)
		if !called {
			t.Errorf("inProduction=%v: next handler was not called", inProduction)
		}
	}
}
