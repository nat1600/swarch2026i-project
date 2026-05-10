package proxy

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// startUpstream creates a test HTTP server with the given handler and returns it.
// The server is closed automatically when the test finishes.
func startUpstream(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return srv
}

// makeRequest sends a GET request through handler and returns the recorded response.
func makeRequest(t *testing.T, handler http.Handler, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rw := httptest.NewRecorder()
	handler.ServeHTTP(rw, req)
	return rw
}

// tripBreaker sends n requests that will all receive 500 from the upstream, driving
// the circuit breaker to the open state. It calls t.Fatal if New() fails.
func tripBreaker(t *testing.T, handler http.Handler, n int, requestPath string) {
	t.Helper()
	for i := 0; i < n; i++ {
		makeRequest(t, handler, requestPath)
	}
}

// --- Path prefix stripping ---

func TestNew_PathPrefixIsStripped(t *testing.T) {
	var receivedPath string
	upstream := startUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	})

	handler, err := New(upstream.URL, "/api/auth")
	if err != nil {
		t.Fatalf("New() returned unexpected error: %v", err)
	}

	makeRequest(t, handler, "/api/auth/login")

	if receivedPath != "/login" {
		t.Errorf("upstream received path %q, want %q", receivedPath, "/login")
	}
}

func TestNew_PathPrefixStrippedToRoot(t *testing.T) {
	var receivedPath string
	upstream := startUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	})

	handler, err := New(upstream.URL, "/api/auth")
	if err != nil {
		t.Fatalf("New() returned unexpected error: %v", err)
	}

	makeRequest(t, handler, "/api/auth")

	// TrimPrefix("/api/auth", "/api/auth") == "" which the proxy sends as empty;
	// httputil normalises that to "/" on the upstream side.
	if receivedPath != "" && receivedPath != "/" {
		t.Errorf("upstream received path %q, want %q or %q", receivedPath, "", "/")
	}
}

// --- CORS header removal ---

func TestNew_UpstreamCORSHeadersAreDeleted(t *testing.T) {
	upstream := startUpstream(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
	})

	handler, err := New(upstream.URL, "/api/auth")
	if err != nil {
		t.Fatalf("New() returned unexpected error: %v", err)
	}

	rw := makeRequest(t, handler, "/api/auth/resource")

	corsHeaders := []string{
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Headers",
	}
	for _, h := range corsHeaders {
		if got := rw.Header().Get(h); got != "" {
			t.Errorf("response header %q should be deleted, but got %q", h, got)
		}
	}
}

// --- Circuit breaker integration ---

// alwaysError is a handler that always returns 500.
func alwaysError(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusInternalServerError)
}

// alwaysOK is a handler that always returns 200.
func alwaysOK(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func TestNew_CircuitBreakerOpensAfter5Failures(t *testing.T) {
	upstream := startUpstream(t, alwaysError)

	handler, err := New(upstream.URL, "/api/svc")
	if err != nil {
		t.Fatalf("New() returned unexpected error: %v", err)
	}

	// Send exactly maxFailures (5) requests to trip the breaker.
	tripBreaker(t, handler, 5, "/api/svc/endpoint")

	// The 6th request should be rejected by the open circuit breaker, not forwarded.
	rw := makeRequest(t, handler, "/api/svc/endpoint")
	if rw.Code != http.StatusServiceUnavailable {
		t.Errorf("6th request: want status %d (circuit open), got %d", http.StatusServiceUnavailable, rw.Code)
	}
}

func TestNew_CircuitBreakerResetAfterTimeout(t *testing.T) {
	// Build a circuit breaker directly with a short resetTimeout so the test
	// doesn't need to wait 30 s (the hardcoded value inside New()).
	// Because we are in the same package (package proxy) we can instantiate
	// CircuitBreaker directly and verify its state machine independently of
	// the HTTP layer.
	cb := newCircuitBreaker(5, 50*time.Millisecond)

	// Trip the breaker.
	for i := 0; i < 5; i++ {
		cb.recordFailure()
	}
	if cb.allow() {
		t.Fatal("circuit breaker should be open immediately after maxFailures")
	}

	// Wait for the reset timeout to expire.
	time.Sleep(60 * time.Millisecond)

	// Now allow() should transition to halfOpen and return true.
	if !cb.allow() {
		t.Fatal("circuit breaker should allow a probe request after resetTimeout")
	}

	// A successful probe should close the breaker.
	cb.recordSuccess()
	if !cb.allow() {
		t.Error("circuit breaker should be closed (allow requests) after a successful probe")
	}
}
