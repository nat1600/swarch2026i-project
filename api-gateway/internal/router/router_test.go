package router

import (
	"api-gateway/config"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// ── getNotFoundHandler ────────────────────────────────────────────────────────

func TestNotFoundHandler_Returns404(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/does/not/exist", nil)

	getNotFoundHandler().ServeHTTP(w, r)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestNotFoundHandler_SetsJSONContentType(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/whatever", nil)

	getNotFoundHandler().ServeHTTP(w, r)

	if got := w.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want %q", got, "application/json")
	}
}

func TestNotFoundHandler_ReturnsJSONEncodedBody(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/whatever", nil)

	getNotFoundHandler().ServeHTTP(w, r)

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if got := body["error"]; got != "Not found" {
		t.Errorf(`body["error"] = %q, want %q`, got, "Not found")
	}
}

func TestNotFoundHandler_HandlesAllMethods(t *testing.T) {
	methods := []string{
		http.MethodGet, http.MethodPost, http.MethodPut,
		http.MethodDelete, http.MethodPatch, http.MethodHead,
	}
	for _, method := range methods {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(method, "/unknown", nil)

		getNotFoundHandler().ServeHTTP(w, r)

		if w.Code != http.StatusNotFound {
			t.Errorf("method=%s: status = %d, want %d", method, w.Code, http.StatusNotFound)
		}
	}
}

// ── getDetailedHealthHandler ──────────────────────────────────────────────────

func TestDetailedHealthHandler_SetsJSONContentType(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	cfg := &config.GeneralConfig{
		Routes: []config.ServiceRoute{
			{PathPrefix: "/api/svc", ServiceName: "svc", TargetURL: upstream.URL},
		},
	}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	getDetailedHealthHandler(cfg).ServeHTTP(w, r)

	if got := w.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want %q", got, "application/json")
	}
}

// With no routes configured, the gateway itself is up and there are no
// upstreams to fail, so the handler should return 200 with an empty JSON map.
func TestDetailedHealthHandler_NoRoutesReturns200AndEmptyMap(t *testing.T) {
	cfg := &config.GeneralConfig{Routes: nil}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	getDetailedHealthHandler(cfg).ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if len(body) != 0 {
		t.Errorf("body = %v, want empty map", body)
	}
}

// Distinct from the existing "upstream returns 5xx" test: here the upstream
// is completely unreachable (server closed). checkService should fail with a
// transport error, the service must be reported NOT OK, and the overall
// response must be 503.
func TestDetailedHealthHandler_UnreachableServiceReports503AndNotOK(t *testing.T) {
	dead := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	deadURL := dead.URL
	dead.Close() // shut it down so connections fail at the TCP layer

	cfg := &config.GeneralConfig{
		Routes: []config.ServiceRoute{
			{PathPrefix: "/api/dead", ServiceName: "dead", TargetURL: deadURL},
		},
	}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	getDetailedHealthHandler(cfg).ServeHTTP(w, r)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusServiceUnavailable)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if got := body["dead"]; got != "NOT OK" {
		t.Errorf("service dead: got %q, want %q", got, "NOT OK")
	}
}

// Mixed scenario: one healthy upstream and one unreachable upstream. The
// healthy service must be reported OK, the dead one NOT OK, and the overall
// status code must be 503 because not all services are healthy.
//
// Also exercises the concurrent fan-out: with two services checked in
// parallel, the WaitGroup + Mutex must produce a deterministic map.
func TestDetailedHealthHandler_MixedHealthyAndUnreachable(t *testing.T) {
	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer good.Close()

	dead := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	deadURL := dead.URL
	dead.Close()

	cfg := &config.GeneralConfig{
		Routes: []config.ServiceRoute{
			{PathPrefix: "/api/good", ServiceName: "good", TargetURL: good.URL},
			{PathPrefix: "/api/dead", ServiceName: "dead", TargetURL: deadURL},
		},
	}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	getDetailedHealthHandler(cfg).ServeHTTP(w, r)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusServiceUnavailable)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if got := body["good"]; got != "OK" {
		t.Errorf("service good: got %q, want %q", got, "OK")
	}
	if got := body["dead"]; got != "NOT OK" {
		t.Errorf("service dead: got %q, want %q", got, "NOT OK")
	}
}

// The handler must hit each upstream at its /health subpath, not the bare
// TargetURL — that's the contract checkService relies on.
func TestDetailedHealthHandler_CallsUpstreamHealthSubpath(t *testing.T) {
	var receivedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	cfg := &config.GeneralConfig{
		Routes: []config.ServiceRoute{
			{PathPrefix: "/api/svc", ServiceName: "svc", TargetURL: upstream.URL},
		},
	}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	getDetailedHealthHandler(cfg).ServeHTTP(w, r)

	if !strings.HasSuffix(receivedPath, "/health") {
		t.Errorf("upstream received path = %q, want suffix %q", receivedPath, "/health")
	}
}

// The concurrent fan-out should check services in parallel: total elapsed
// time must be close to the slowest upstream, not the sum of all upstream
// delays. With 3 services each sleeping 200ms, a sequential implementation
// would take ~600ms; the concurrent one should finish in ~200ms.
func TestDetailedHealthHandler_ChecksUpstreamsConcurrently(t *testing.T) {
	const (
		perServiceDelay = 200 * time.Millisecond
		serviceCount    = 3
		// Generous upper bound to avoid flakiness on a slow CI runner,
		// but still well under the sequential lower bound of 600ms.
		concurrentBudget = 450 * time.Millisecond
	)

	mkSlowUpstream := func() *httptest.Server {
		return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(perServiceDelay)
			w.WriteHeader(http.StatusOK)
		}))
	}

	servers := make([]*httptest.Server, 0, serviceCount)
	routes := make([]config.ServiceRoute, 0, serviceCount)
	for i := 0; i < serviceCount; i++ {
		srv := mkSlowUpstream()
		defer srv.Close()
		servers = append(servers, srv)
		routes = append(routes, config.ServiceRoute{
			PathPrefix:  fmt.Sprintf("/api/svc%d", i),
			ServiceName: fmt.Sprintf("svc%d", i),
			TargetURL:   srv.URL,
		})
	}

	cfg := &config.GeneralConfig{Routes: routes}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health/detailed", nil)

	start := time.Now()
	getDetailedHealthHandler(cfg).ServeHTTP(w, r)
	elapsed := time.Since(start)

	if elapsed >= concurrentBudget {
		t.Errorf("handler took %v with %d services × %v delay; expected < %v (sequential would be ~%v)",
			elapsed, serviceCount, perServiceDelay, concurrentBudget, perServiceDelay*serviceCount)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	for i := 0; i < serviceCount; i++ {
		name := fmt.Sprintf("svc%d", i)
		if got := body[name]; got != "OK" {
			t.Errorf("service %s: got %q, want %q", name, got, "OK")
		}
	}
}
