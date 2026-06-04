#!/bin/bash

# Payment Service Database Migration Script

echo "Starting Payment Service database migration..."

echo "Waiting for PostgreSQL..."
until pg_isready -h ${POSTGRES_HOST} -U ${POSTGRES_USER}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready - schema will be created/updated by Hibernate on service startup"
echo "Migration completed successfully"
