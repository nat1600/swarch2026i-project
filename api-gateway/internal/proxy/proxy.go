package proxy

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func New(targetURL string, pathPrefix string) (http.Handler, error) {
	target, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	proxy := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)

			// Remove original prefix
			originalPath := pr.In.URL.Path
			pr.Out.URL.Path = strings.TrimPrefix(originalPath, pathPrefix)
		},
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Perrito, que quiere? %s", r.URL)
		proxy.ServeHTTP(w, r)
	}), nil
}
