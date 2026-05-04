package proxy

import (
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.statusCode = code
	rr.ResponseWriter.WriteHeader(code)
}

func New(targetURL string, pathPrefix string) (http.Handler, error) {
	target, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: 5 * time.Second, // Timeout for establishing the TCP connection
		}).DialContext,
		ResponseHeaderTimeout: 10 * time.Second, // Timeout waiting for the first response
		MaxIdleConns:          10,               // Maximum of IDLE connections
		MaxIdleConnsPerHost:   5,
		IdleConnTimeout:       90 * time.Second, // Close IDLE connections after 90 seconds
	}

	proxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)
			pr.SetXForwarded()

			// Remove original prefix
			originalPath := pr.In.URL.Path
			pr.Out.URL.Path = strings.TrimPrefix(originalPath, pathPrefix)
		},
		ModifyResponse: func(resp *http.Response) error {
			resp.Header.Del("Access-Control-Allow-Origin")
			resp.Header.Del("Access-Control-Allow-Methods")
			resp.Header.Del("Access-Control-Allow-Headers")
			return nil
		},
	}

	cb := NewCircuitBreaker(5, 30*time.Second)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cb.allow() {
			http.Error(w, fmt.Sprintf("service %s is unavailable", target.Host), http.StatusServiceUnavailable)
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
