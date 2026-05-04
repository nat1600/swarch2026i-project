package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseRecorder_DefaultsTo200WhenWriteHeaderNeverCalled(t *testing.T) {
	w := httptest.NewRecorder()
	rr := &responseRecorder{
		statusCode:     http.StatusOK,
		ResponseWriter: w,
	}

	if rr.statusCode != http.StatusOK {
		t.Errorf("default statusCode = %d, want %d", rr.statusCode, http.StatusOK)
	}
}

func TestResponseRecorder_CapturesActualStatusWhenWriteHeaderCalled(t *testing.T) {
	cases := []int{
		http.StatusCreated,
		http.StatusBadRequest,
		http.StatusUnauthorized,
		http.StatusNotFound,
		http.StatusInternalServerError,
	}

	for _, code := range cases {
		w := httptest.NewRecorder()
		rr := &responseRecorder{
			statusCode:     http.StatusOK,
			ResponseWriter: w,
		}
		rr.WriteHeader(code)

		if rr.statusCode != code {
			t.Errorf("WriteHeader(%d): statusCode = %d, want %d", code, rr.statusCode, code)
		}
	}
}

func TestLogging_AlwaysCallsNext(t *testing.T) {
	called := false
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/some/path", nil)

	Logging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})).ServeHTTP(w, r)

	if !called {
		t.Error("next handler was not called")
	}
}

func TestLogging_CallsNextWithDifferentMethods(t *testing.T) {
	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete}
	for _, method := range methods {
		called := false
		w := httptest.NewRecorder()
		r := httptest.NewRequest(method, "/", nil)

		Logging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
		})).ServeHTTP(w, r)

		if !called {
			t.Errorf("method=%s: next handler was not called", method)
		}
	}
}
