package middleware

import (
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimit_RequestsWithinLimitPassThrough(t *testing.T) {
	handler := RateLimit(10, 5)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 5; i++ {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.RemoteAddr = "1.2.3.4:1234"
		handler.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("request %d: status = %d, want %d", i+1, w.Code, http.StatusOK)
		}
	}
}

func TestRateLimit_RequestsExceedingLimitGet429(t *testing.T) {
	handler := RateLimit(1, 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	var got429 bool
	for i := 0; i < 20; i++ {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.RemoteAddr = "5.6.7.8:9999"
		handler.ServeHTTP(w, r)
		if w.Code == http.StatusTooManyRequests {
			got429 = true
			break
		}
	}

	if !got429 {
		t.Error("expected at least one 429 response after exhausting the burst, got none")
	}
}

func TestRateLimit_DifferentIPsHaveIndependentLimiters(t *testing.T) {
	handler := RateLimit(1, 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 10; i++ {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.RemoteAddr = "10.0.0.1:1111"
		handler.ServeHTTP(w, r)
	}

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = "10.0.0.2:1111"
	handler.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("fresh IP got status %d, want %d — limiters are not independent", w.Code, http.StatusOK)
	}
}

func TestRateLimit_IPExtractedCorrectlyFromRemoteAddrWithPort(t *testing.T) {
	cases := []struct {
		remoteAddr string
		wantIP     string
	}{
		{"1.2.3.4:5678", "1.2.3.4"},
		{"192.168.1.100:80", "192.168.1.100"},
	}

	for _, tc := range cases {
		ip, _, err := net.SplitHostPort(tc.remoteAddr)
		if err != nil {
			t.Fatalf("remoteAddr=%s: SplitHostPort error: %v", tc.remoteAddr, err)
		}
		if ip != tc.wantIP {
			t.Errorf("remoteAddr=%s: got IP %q, want %q", tc.remoteAddr, ip, tc.wantIP)
		}

		limiter := newIPLimiter(100, 10)
		l1 := limiter.getLimiter(ip)
		l2 := limiter.getLimiter(tc.wantIP)
		if l1 != l2 {
			t.Errorf("remoteAddr=%s: different limiter for extracted IP %q vs wantIP %q", tc.remoteAddr, ip, tc.wantIP)
		}
	}
}
