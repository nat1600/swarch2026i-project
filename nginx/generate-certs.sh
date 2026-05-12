#!/bin/bash
# Generates a self-signed certificate for local development.
# Run once before `docker compose up`.
set -e
CERTS_DIR="$(dirname "$0")/certs"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -subj "/C=CO/ST=Bogota/L=Bogota/O=Parla/CN=localhost"
echo "Certificates generated in $CERTS_DIR"
