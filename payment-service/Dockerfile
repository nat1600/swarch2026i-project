# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY scripts ./scripts

RUN mvn clean package -DskipTests

# Runtime stage with migration tools
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Install PostgreSQL client and curl
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Maven in runtime image
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy POM and source for migrations
COPY pom.xml .
COPY src ./src
COPY scripts ./scripts

# Copy pre-built JAR for running application
COPY --from=builder /app/target/payment-service-*.jar app.jar

EXPOSE 8005

# Default: run as application (CMD can be overridden for migrations)
CMD ["java", "-jar", "app.jar"]
