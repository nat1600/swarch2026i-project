package proxy

import (
	"sync"
	"time"
)

// State transitions:
//
//	closed   --failures >= maxFailures--> open
//	open     --resetTimeout elapsed-----> halfOpen
//	halfOpen --success------------------> closed
//	halfOpen --failure------------------> open
type state int

const (
	closed   state = iota // requests pass through
	halfOpen              // a single probe is allowed to test recovery
	open                  // requests are rejected
)

// CircuitBreaker is a goroutine-safe breaker that trips after a
// configurable number of consecutive failures.
type CircuitBreaker struct {
	mu           sync.Mutex
	state        state
	failures     int
	maxFailures  int
	resetTimeout time.Duration
	lastFailure  time.Time
}

func newCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:        closed,
		maxFailures:  maxFailures,
		resetTimeout: resetTimeout,
	}
}

// allow reports whether a request may be sent to the upstream. When the
// breaker is open and the reset timeout has elapsed, the next caller is
// promoted to a half-open probe.
func (cb *CircuitBreaker) allow() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	switch cb.state {
	case closed:
		return true
	case open:
		if time.Since(cb.lastFailure) >= cb.resetTimeout {
			cb.state = halfOpen
			return true
		}
	case halfOpen:
		return false
	}
	return false
}

func (cb *CircuitBreaker) recordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failures = 0
	cb.state = closed
}

func (cb *CircuitBreaker) recordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failures++
	cb.lastFailure = time.Now()
	if cb.failures >= cb.maxFailures || cb.state == halfOpen {
		cb.state = open
	}
}
