package proxy

import (
	"testing"
	"time"
)

func TestCircuitBreaker_StartsClosedAndAllowsRequests(t *testing.T) {
	cb := newCircuitBreaker(3, time.Second)
	if !cb.allow() {
		t.Error("new circuit breaker should be closed and allow requests")
	}
}

func TestCircuitBreaker_OpensAfterMaxFailures(t *testing.T) {
	cb := newCircuitBreaker(3, time.Second)
	for i := 0; i < 3; i++ {
		cb.recordFailure()
	}
	if cb.allow() {
		t.Error("circuit breaker should be open after maxFailures failures")
	}
}

func TestCircuitBreaker_HalfOpenAfterResetTimeout(t *testing.T) {
	cb := newCircuitBreaker(1, 50*time.Millisecond)
	cb.recordFailure()

	if cb.allow() {
		t.Error("should be open immediately after maxFailures")
	}

	time.Sleep(60 * time.Millisecond)

	if !cb.allow() {
		t.Error("should transition to half-open (allow one request) after resetTimeout")
	}
}

func TestCircuitBreaker_SuccessInHalfOpenResetsToClose(t *testing.T) {
	cb := newCircuitBreaker(1, 50*time.Millisecond)
	cb.recordFailure()
	time.Sleep(60 * time.Millisecond)
	cb.allow()

	cb.recordSuccess()

	if !cb.allow() {
		t.Error("circuit breaker should be closed after success in half-open state")
	}
}

func TestCircuitBreaker_FailureInHalfOpenGoesBackToOpen(t *testing.T) {
	cb := newCircuitBreaker(1, 50*time.Millisecond)
	cb.recordFailure()
	time.Sleep(60 * time.Millisecond)
	cb.allow()

	cb.recordFailure()

	if cb.allow() {
		t.Error("circuit breaker should go back to open immediately after failure in half-open state")
	}
}

func TestCircuitBreaker_RecordSuccessResetFailureCount(t *testing.T) {
	cb := newCircuitBreaker(3, time.Second)
	cb.recordFailure()
	cb.recordFailure()
	cb.recordSuccess()

	if cb.failures != 0 {
		t.Errorf("recordSuccess should reset failure count to 0, got %d", cb.failures)
	}
}

func TestCircuitBreaker_DoesNotOpenBeforeMaxFailures(t *testing.T) {
	cb := newCircuitBreaker(3, time.Second)
	cb.recordFailure()
	cb.recordFailure()

	if !cb.allow() {
		t.Error("circuit breaker should still be closed after fewer failures than maxFailures")
	}
}

func TestCircuitBreaker_HalfOpenBlocksSecondConcurrentRequest(t *testing.T) {
	cb := newCircuitBreaker(1, 50*time.Millisecond)
	cb.recordFailure()
	time.Sleep(60 * time.Millisecond)

	cb.allow()

	if cb.allow() {
		t.Error("half-open should block a second request while one is already testing")
	}
}
