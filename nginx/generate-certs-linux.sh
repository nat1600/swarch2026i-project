set -e

mkdir -p certs
chmod 700 certs

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/selfsigned.key \
    -out certs/selfsigned.crt \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Load the certs into Kubernetes as a TLS Secret.
# Both nginx deployments (web-app and extension) reference this Secret.
kubectl create secret tls nginx-tls \
    --cert=certs/selfsigned.crt \
    --key=certs/selfsigned.key \
    --dry-run=client -o yaml | kubectl apply -f -
