package router

import (
	"api-gateway/config"
	"api-gateway/internal/middleware"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/auth0/go-jwt-middleware/v3/jwks"
	"github.com/auth0/go-jwt-middleware/v3/validator"
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v3"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

// testConfig builds a GeneralConfig with the given routes, pointed at the
// local JWKS server whose host:port is in authDomain.
func testConfig(routes []config.ServiceRoute, authDomain string) *config.GeneralConfig {
	return &config.GeneralConfig{
		Port:        "8080",
		Environment: "test",
		Auth: config.AuthConfig{
			Domain:   authDomain,
			Audience: "test-audience",
		},
		Routes: routes,
	}
}

// newHealthOnlyMux builds a mux that only registers GET /health (no proxy
// routes, so no auth middleware is ever created). Useful for health tests.
func newHealthOnlyMux(t *testing.T, routes []config.ServiceRoute) http.Handler {
	t.Helper()
	// Use a deliberately broken domain — auth middleware is created but never
	// called for the /health endpoint, so JWKS discovery never fires.
	cfg := testConfig(routes, "invalid.domain.test")
	mux, err := New(cfg)
	if err != nil {
		t.Fatalf("router.New: %v", err)
	}
	return mux
}

// newFullMux creates a complete router including middleware-wrapped proxy
// routes. The auth domain is deliberately invalid; tests that never hit the
// auth layer (OPTIONS, rate-limit exhaustion, security headers returning 401)
// still work correctly because the middleware chain short-circuits early.
func newFullMux(t *testing.T, routes []config.ServiceRoute) http.Handler {
	t.Helper()
	cfg := testConfig(routes, "invalid.domain.test")
	mux, err := New(cfg)
	if err != nil {
		t.Fatalf("router.New: %v", err)
	}
	return mux
}

// fakeUpstream returns a test server that always responds with the given
// status code and records the request path it received.
func fakeUpstream(t *testing.T, statusCode int, receivedPath *string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if receivedPath != nil {
			*receivedPath = r.URL.Path
		}
		w.WriteHeader(statusCode)
	}))
}

// ── Test 1: Health endpoint – all upstreams healthy ───────────────────────────

func TestHealthAllHealthy(t *testing.T) {
	svcA := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer svcA.Close()

	svcB := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer svcB.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/alpha", ServiceName: "alpha", TargetURL: svcA.URL},
		{PathPrefix: "/api/beta", ServiceName: "beta", TargetURL: svcB.URL},
	}
	mux := newHealthOnlyMux(t, routes)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health", nil)
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	for _, svc := range []string{"alpha", "beta"} {
		if got := body[svc]; got != "OK" {
			t.Errorf("service %q: got %q, want %q", svc, got, "OK")
		}
	}
}

// ── Test 2: Health endpoint – one upstream unhealthy ──────────────────────────

func TestHealthOneUnhealthy(t *testing.T) {
	svcOK := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer svcOK.Close()

	svcBad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer svcBad.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/good", ServiceName: "good", TargetURL: svcOK.URL},
		{PathPrefix: "/api/bad", ServiceName: "bad", TargetURL: svcBad.URL},
	}
	mux := newHealthOnlyMux(t, routes)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/health", nil)
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", w.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if got := body["good"]; got != "OK" {
		t.Errorf("service good: got %q, want %q", got, "OK")
	}
	if got := body["bad"]; got != "NOT OK" {
		t.Errorf("service bad: got %q, want %q", got, "NOT OK")
	}
}

// ── Test 3: CORS preflight short-circuits before auth ─────────────────────────

func TestCORSPreflightShortCircuitsBeforeAuth(t *testing.T) {
	upstreamReached := false
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamReached = true
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/auth", ServiceName: "auth", TargetURL: upstream.URL},
	}
	mux := newFullMux(t, routes)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodOptions, "/api/auth/login", nil)
	r.Header.Set("Origin", "http://localhost:3000")
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204 from preflight, got %d", w.Code)
	}
	if upstreamReached {
		t.Error("upstream should not have been reached during OPTIONS preflight")
	}
}

// ── Test 4: Security headers always present ───────────────────────────────────

func TestSecurityHeadersAlwaysPresent(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/auth", ServiceName: "auth", TargetURL: upstream.URL},
	}
	mux := newFullMux(t, routes)

	// Send a GET without a token – auth middleware will reject with 401.
	// Security headers are set by Security middleware, which runs first.
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/auth/profile", nil)
	mux.ServeHTTP(w, r)

	// The request should fail (401 or 500 from JWKS unreachable), but
	// security headers must be present regardless.
	if got := w.Header().Get("X-Content-Type-Options"); got == "" {
		t.Error("X-Content-Type-Options header missing")
	}
	if got := w.Header().Get("X-Frame-Options"); got == "" {
		t.Error("X-Frame-Options header missing")
	}
}

// ── Test 5: Request-ID generated when absent ──────────────────────────────────

func TestRequestIDGeneratedWhenAbsent(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/auth", ServiceName: "auth", TargetURL: upstream.URL},
	}
	mux := newFullMux(t, routes)

	// OPTIONS bypasses auth, so the full middleware chain (Security →
	// RequestID → … → CORS) runs and we get a clean 204 response.
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodOptions, "/api/auth/ping", nil)
	mux.ServeHTTP(w, r)

	id := w.Header().Get("X-Request-ID")
	if id == "" {
		t.Error("expected a non-empty X-Request-ID header when none was provided")
	}
}

// ── Test 6: Request-ID propagated when present ────────────────────────────────

func TestRequestIDPropagatedWhenPresent(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/auth", ServiceName: "auth", TargetURL: upstream.URL},
	}
	mux := newFullMux(t, routes)

	const wantID = "test-123"
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodOptions, "/api/auth/ping", nil)
	r.Header.Set("X-Request-ID", wantID)
	mux.ServeHTTP(w, r)

	if got := w.Header().Get("X-Request-ID"); got != wantID {
		t.Errorf("X-Request-ID = %q, want %q", got, wantID)
	}
}

// ── Test 7: Rate limiting returns 429 after burst ─────────────────────────────

func TestRateLimitReturns429AfterBurst(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	routes := []config.ServiceRoute{
		{PathPrefix: "/api/auth", ServiceName: "auth", TargetURL: upstream.URL},
	}
	mux := newFullMux(t, routes)

	// router.New configures RateLimit(10, 20): burst=20, so the 21st
	// synchronous request from the same IP must be rejected.
	//
	// We use GET (not OPTIONS) because OPTIONS short-circuits at the CORS
	// middleware, which runs before RateLimit. A GET request passes through
	// CORS and reaches the RateLimit middleware, which will fire 429 once the
	// bucket is exhausted — before the Auth middleware even has a chance to run.
	var got429 bool
	for i := 0; i < 25; i++ {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/api/auth/ping", nil)
		r.RemoteAddr = "192.0.2.1:9999" // fixed IP so all share one bucket
		mux.ServeHTTP(w, r)
		if w.Code == http.StatusTooManyRequests {
			got429 = true
			break
		}
	}

	if !got429 {
		t.Error("expected at least one 429 after exhausting the rate-limit burst, got none")
	}
}

// ── JWT test helpers ───────────────────────────────────────────────────────────

// generateRSAKeyPair creates a 2048-bit RSA key pair for use in tests.
func generateRSAKeyPair(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate RSA key: %v", err)
	}
	return key
}

// jwksServer spins up an httptest.Server that serves the JWKS derived from
// the given RSA private key at /.well-known/jwks.json.
// It returns the server and the raw URL of the JWKS endpoint.
func jwksServer(t *testing.T, privKey *rsa.PrivateKey) (*httptest.Server, string) {
	t.Helper()

	pubJWK, err := jwk.PublicKeyOf(privKey)
	if err != nil {
		t.Fatalf("jwk.PublicKeyOf: %v", err)
	}
	// Give the key an ID so the JWT header can reference it.
	if err := pubJWK.Set(jwk.KeyIDKey, "test-key-1"); err != nil {
		t.Fatalf("set kid: %v", err)
	}
	// Mark algorithm for interoperability.
	if err := pubJWK.Set(jwk.AlgorithmKey, jwa.RS256()); err != nil {
		t.Fatalf("set alg: %v", err)
	}

	keySet := jwk.NewSet()
	if err := keySet.AddKey(pubJWK); err != nil {
		t.Fatalf("add key to set: %v", err)
	}

	keySetJSON, err := json.Marshal(keySet)
	if err != nil {
		t.Fatalf("marshal JWKS: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(keySetJSON)
	}))
	t.Cleanup(srv.Close)

	return srv, srv.URL + "/.well-known/jwks.json"
}

// signToken mints a signed JWT using the given private key.
// issuer must be "https://{domain}/" to match what middleware.Auth expects.
func signToken(t *testing.T, privKey *rsa.PrivateKey, issuer, audience, subject string) string {
	t.Helper()

	tok := jwt.New()
	if err := tok.Set(jwt.IssuerKey, issuer); err != nil {
		t.Fatalf("set iss: %v", err)
	}
	if err := tok.Set(jwt.AudienceKey, audience); err != nil {
		t.Fatalf("set aud: %v", err)
	}
	if err := tok.Set(jwt.SubjectKey, subject); err != nil {
		t.Fatalf("set sub: %v", err)
	}
	if err := tok.Set(jwt.IssuedAtKey, time.Now()); err != nil {
		t.Fatalf("set iat: %v", err)
	}
	if err := tok.Set(jwt.ExpirationKey, time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("set exp: %v", err)
	}

	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), privKey))
	if err != nil {
		t.Fatalf("jwt.Sign: %v", err)
	}
	return string(signed)
}

// buildAuthMiddlewareWithLocalJWKS constructs an Auth middleware that fetches
// JWKS directly from a local HTTP URL (bypassing OIDC discovery and the HTTPS
// enforcement that would block a plain httptest.Server). This is the only way
// to test JWT validation without a real Auth0 tenant.
//
// Background: middleware.Auth hard-codes an "https://" prefix for the issuer
// URL, which causes the Auth0 OIDC library to reject any jwks_uri that isn't
// also HTTPS. WithCustomJWKSURI skips discovery entirely, so the HTTP JWKS
// server is accepted.
func buildAuthMiddlewareWithLocalJWKS(
	t *testing.T,
	issuer string,
	audience string,
	jwksURL string,
) middleware.Middleware {
	t.Helper()

	issuerURL, err := url.Parse(issuer)
	if err != nil {
		t.Fatalf("parse issuer URL: %v", err)
	}
	customJWKSURI, err := url.Parse(jwksURL)
	if err != nil {
		t.Fatalf("parse JWKS URL: %v", err)
	}

	provider, err := jwks.NewCachingProvider(
		jwks.WithIssuerURL(issuerURL),
		jwks.WithCustomJWKSURI(customJWKSURI),
	)
	if err != nil {
		t.Fatalf("NewCachingProvider: %v", err)
	}

	jwtValidator, err := validator.New(
		validator.WithKeyFunc(provider.KeyFunc),
		validator.WithAlgorithm(validator.RS256),
		validator.WithIssuer(issuer),
		validator.WithAudience(audience),
	)
	if err != nil {
		t.Fatalf("validator.New: %v", err)
	}

	jwtMiddleware, err := jwtmiddleware.New(
		jwtmiddleware.WithValidator(jwtValidator),
	)
	if err != nil {
		t.Fatalf("jwtmiddleware.New: %v", err)
	}

	return func(next http.Handler) http.Handler {
		return jwtMiddleware.CheckJWT(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		}))
	}
}

// buildJWTTestMux builds a minimal http.ServeMux with a single proxy route
// protected by a locally-pointed JWT middleware. This avoids the HTTPS
// restriction imposed by router.New → middleware.Auth.
func buildJWTTestMux(
	t *testing.T,
	upstream *httptest.Server,
	pathPrefix string,
	authMw middleware.Middleware,
) http.Handler {
	t.Helper()

	mux := http.NewServeMux()

	middlewares := []middleware.Middleware{
		middleware.Security(false),
		middleware.RequestID,
		middleware.Logging,
		middleware.CORS("http://localhost:3000"),
		middleware.RateLimit(1000, 1000), // effectively unlimited for JWT tests
		authMw,
	}

	// Strip pathPrefix when forwarding – mirrors what proxy.New does.
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stripped := strings.TrimPrefix(r.URL.Path, pathPrefix)
		proxyReq, err := http.NewRequest(r.Method, upstream.URL+stripped, r.Body)
		if err != nil {
			http.Error(w, "proxy error", http.StatusInternalServerError)
			return
		}
		proxyReq.Header = r.Header.Clone()

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(proxyReq)
		if err != nil {
			http.Error(w, "upstream error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		for k, vv := range resp.Header {
			for _, v := range vv {
				w.Header().Add(k, v)
			}
		}
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	mux.Handle(pathPrefix+"/", middleware.Chain(handler, middlewares...))
	return mux
}

// ── Test 8: Valid JWT routes request to upstream with prefix stripped ──────────

func TestValidJWTRoutesToUpstreamWithPrefixStripped(t *testing.T) {
	var receivedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	privKey := generateRSAKeyPair(t)
	_, jwksURL := jwksServer(t, privKey)

	const (
		domain   = "auth.example.test"
		issuer   = "https://" + domain + "/"
		audience = "test-audience"
		subject  = "user|abc123"
		prefix   = "/api/auth"
	)

	authMw := buildAuthMiddlewareWithLocalJWKS(t, issuer, audience, jwksURL)
	mux := buildJWTTestMux(t, upstream, prefix, authMw)

	token := signToken(t, privKey, issuer, audience, subject)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, prefix+"/login", nil)
	r.Header.Set("Authorization", "Bearer "+token)
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		body, _ := io.ReadAll(w.Body)
		t.Fatalf("expected 200, got %d — body: %s", w.Code, body)
	}
	// The upstream must receive "/login", not "/api/auth/login".
	if receivedPath != "/login" {
		t.Errorf("upstream received path %q, want %q", receivedPath, "/login")
	}
}

// ── Test 9: Invalid JWT returns 401 ───────────────────────────────────────────

func TestInvalidJWTReturns401(t *testing.T) {
	upstreamReached := false
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamReached = true
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	privKey := generateRSAKeyPair(t)
	_, jwksURL := jwksServer(t, privKey)

	const (
		domain   = "auth.example.test"
		issuer   = "https://" + domain + "/"
		audience = "test-audience"
		prefix   = "/api/auth"
	)

	authMw := buildAuthMiddlewareWithLocalJWKS(t, issuer, audience, jwksURL)
	mux := buildJWTTestMux(t, upstream, prefix, authMw)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, prefix+"/profile", nil)
	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "this.is.not.a.valid.jwt"))
	mux.ServeHTTP(w, r)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
	if upstreamReached {
		t.Error("upstream should not be reached with an invalid JWT")
	}
}
