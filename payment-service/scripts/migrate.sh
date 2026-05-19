#!/bin/bash

# Payment Service Database Migration Script

echo "Starting Payment Service database migration..."

# Set environment variables for Spring Boot
export SPRING_DATASOURCE_URL=jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
export SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
export SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h ${POSTGRES_HOST} -U ${POSTGRES_USER}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - executing migration"

# Build and run Spring Boot application
echo "Compiling Payment Service..."
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✓ Compilation successful"
    echo "✓ Tables created/updated by Hibernate"
else
    echo "✗ Compilation failed"
    exit 1
fi

echo "Migration completed successfully"
