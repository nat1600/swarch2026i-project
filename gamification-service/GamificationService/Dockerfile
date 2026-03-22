FROM ubuntu:latest
LABEL authors="carlosivan"

# ── Stage 1: Build the JAR using Maven ──────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first and download dependencies separately
# This way Docker caches the dependencies layer and only re-downloads
# them if pom.xml changes, making subsequent builds much faster
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the JAR
COPY src ./src
RUN mvn clean install -DskipTests

# ── Stage 2: Run the JAR using a lightweight JDK image ──────────────────────
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copy only the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
