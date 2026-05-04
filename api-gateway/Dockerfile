# ── Build stage ───────────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o gateway cmd/main.go

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app .
COPY config.json .

EXPOSE 8080

CMD ["./gateway"]