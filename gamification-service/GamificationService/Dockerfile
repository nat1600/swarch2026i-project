# ── Stage 1: build the Spring Boot fat JAR ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Cache dependencies before copying source
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
