// Package proxy builds the per-route reverse-proxy handler that
// forwards requests to an upstream microservice, with timeouts and a
// circuit breaker.
package proxy

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

const (
	dialTimeout           = 5 * time.Second
	responseHeaderTimeout = 10 * time.Second
	maxIdleConns          = 10
	maxIdleConnsPerHost   = 5
	idleConnTimeout       = 90 * time.Second

	cbMaxFailures  = 5
	cbResetTimeout = 30 * time.Second
)

// responseRecorder captures the upstream's status code so the proxy
// handler can feed it into the circuit breaker.
type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.statusCode = code
	rr.ResponseWriter.WriteHeader(code)
}

// New returns an http.Handler that reverse-proxies requests to targetURL,
// stripping pathPrefix from the incoming path. Transport errors and
// open-circuit rejections are returned as JSON 503 responses.
func New(targetURL string, pathPrefix string) (http.Handler, error) {
	target, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: dialTimeout,
		}).DialContext,
		ResponseHeaderTimeout: responseHeaderTimeout,
		MaxIdleConns:          maxIdleConns,
		MaxIdleConnsPerHost:   maxIdleConnsPerHost,
		IdleConnTimeout:       idleConnTimeout,
	}

	proxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)
			pr.SetXForwarded()
			pr.Out.URL.Path = strings.TrimPrefix(pr.In.URL.Path, pathPrefix)
		},
		ModifyResponse: func(resp *http.Response) error {
			// CORS is owned by the gateway; drop upstream duplicates.
			resp.Header.Del("Access-Control-Allow-Origin")
			resp.Header.Del("Access-Control-Allow-Methods")
			resp.Header.Del("Access-Control-Allow-Headers")
			return nil
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			writeError(w, target, err)
		},
	}

	cb := newCircuitBreaker(cbMaxFailures, cbResetTimeout)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cb.allow() {
			writeError(w, target, fmt.Errorf("service %s is unavailable", target.Host))
			return
		}

		rr := &responseRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}
		proxy.ServeHTTP(rr, r)

		if rr.statusCode >= 500 {
			cb.recordFailure()
		} else {
			cb.recordSuccess()
		}
	}), nil
}

func writeError(w http.ResponseWriter, target *url.URL, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusServiceUnavailable)
	if encErr := json.NewEncoder(w).Encode(map[string]string{"error": err.Error()}); encErr != nil {
		slog.Error("failed to encode response", "error", encErr, "host", target.Host)
	}
}
