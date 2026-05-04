package proxy

import (
	"sync"
	"time"
)

type state int

const (
	closed   state = iota // normal, requests pass
	halfOpen              // testing if the microservice recovered
	open                  // cut, request are not forwarded
)

type CircuitBreaker struct {
	mu           sync.Mutex
	state        state
	failures     int
	maxFailures  int
	resetTimeout time.Duration
	lastFailure  time.Time
}

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:        closed,
		maxFailures:  maxFailures,
		resetTimeout: resetTimeout,
	}
}

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
		return false // another request is testing
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
