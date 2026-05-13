// Package middleware contains the gateway's HTTP middlewares and the
// Chain combinator that wires them together.
package middleware

import "net/http"

// Middleware wraps an http.Handler with additional behaviour.
type Middleware func(handler http.Handler) http.Handler

// Chain composes middlewares around handler so that middleware[0] is the
// outermost wrapper: a request enters through middleware[0] and ends at
// handler.
func Chain(handler http.Handler, middleware ...Middleware) http.Handler {
	for i := len(middleware) - 1; i >= 0; i-- {
		handler = middleware[i](handler)
	}
	return handler
}
