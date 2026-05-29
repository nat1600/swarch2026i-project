package middleware

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"unicode"
)

const maxBodyBytes     = 1 * 1024 * 1024 // 1 MB
const maxWords         = 60              // límite de palabras
const maxCamelCaseWords = 8             // máx palabras CamelCase dentro de un token

var forbiddenPatterns = []string{
	// — Prompt injection: variantes de "ignorar instrucciones" —
	"ignore previous",
	"ignore all",
	"ignore the above",
	"ignore your",
	"disregard previous",
	"disregard all",
	"disregard your",
	"forget previous",
	"forget all",
	"override instructions",
	"override your",
	"system rules",
	"system prompt",
	"system instructions",
	"new instructions",
	"instead of generating",
	"return a list of",
	"do not mention this",
	"only output valid",
	"controlled security",
	"academic project",
	"you are now",
	"act as if",
	"pretend you are",
	"pretend to be",
	"your new role",
	"jailbreak",
	"dan mode",
	"do anything now",
	// — SQL injection —
	"or 1 1",
	"drop table",
	"union select",
	"insert into",
	"delete from",
	// — NoSQL injection —
	"$where",
	"$gt",
	"$ne",
	"$or",
	"$and",
	"$regex",
}

// normalizeInput converts any obfuscated input to a comparable plain string.
// Handles: CamelCase, separators (dots, underscores, dashes), extra spaces.
func normalizeInput(s string) string {
	// 1. CamelCase → spaces: "IgnorePrevious" → "Ignore Previous"
	var spaced strings.Builder
	runes := []rune(s)
	for i, r := range runes {
		if i > 0 && unicode.IsUpper(r) && !unicode.IsUpper(runes[i-1]) {
			spaced.WriteRune(' ')
		}
		spaced.WriteRune(r)
	}
	// 2. Lowercase
	lower := strings.ToLower(spaced.String())
	// 3. Replace non-alphanumeric with spaces
	var result strings.Builder
	for _, r := range lower {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			result.WriteRune(r)
		} else {
			result.WriteRune(' ')
		}
	}
	// 4. Collapse multiple spaces
	return strings.Join(strings.Fields(result.String()), " ")
}

// hasSuspiciousCamelCase detecta tokens con demasiadas palabras CamelCase
// concatenadas. Opera token por token para no acumular transiciones
// entre palabras normales separadas por espacios.
func hasSuspiciousCamelCase(s string) bool {
	for _, token := range strings.Fields(s) {
		transitions := 0
		runes := []rune(token)
		for i, r := range runes {
			if i > 0 && unicode.IsUpper(r) && unicode.IsLower(runes[i-1]) {
				transitions++
				if transitions > maxCamelCaseWords {
					return true
				}
			}
		}
	}
	return false
}

// InputValidator is a middleware that rejects requests whose payload:
//   - exceeds maxBodyBytes
//   - exceeds maxWords words
//   - contains a token with too many CamelCase words concatenated
//   - contains a known injection pattern
//
// Only POST, PUT, and PATCH requests are inspected — GET and DELETE
// carry no body and are forwarded immediately.
var InputValidator Middleware = func(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Only validate mutating methods
		if r.Method != http.MethodPost &&
			r.Method != http.MethodPut &&
			r.Method != http.MethodPatch {
			next.ServeHTTP(w, r)
			return
		}

		// 2. Read body with size limit
		body, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes+1))
		if err != nil {
			http.Error(w, "failed to read request body", http.StatusBadRequest)
			return
		}

		// 3. Reject oversized body
		if int64(len(body)) > maxBodyBytes {
			http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
			return
		}

		rawBody := string(body)

		// 4. Word count limit
		if len(strings.Fields(rawBody)) > maxWords {
			http.Error(w, "input too long", http.StatusBadRequest)
			return
		}

		// 5. LLM injection detection via CamelCase density per token
		if hasSuspiciousCamelCase(rawBody) {
			http.Error(w, "invalid input", http.StatusBadRequest)
			return
		}

		// 6. Normalize and check forbidden patterns
		normalized := normalizeInput(rawBody)
		for _, pattern := range forbiddenPatterns {
			if strings.Contains(normalized, pattern) {
				http.Error(w, "invalid input", http.StatusBadRequest)
				return
			}
		}

		// 7. Restore body and continue
		r.Body = io.NopCloser(bytes.NewReader(body))
		next.ServeHTTP(w, r)
	})
}