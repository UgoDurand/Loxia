# =====================================================================
# Loxia — chat-service Dockerfile (multi-stage)
# Build context: ./services  (see docker-compose.yml)
# =====================================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml ./pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY catalog-service/pom.xml ./catalog-service/pom.xml
COPY rental-service/pom.xml ./rental-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml
COPY chat-service/pom.xml ./chat-service/pom.xml

RUN mvn -q -pl chat-service -am dependency:go-offline

COPY chat-service/src ./chat-service/src
RUN mvn -q -pl chat-service -am package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S loxia && adduser -S loxia -G loxia
WORKDIR /app

COPY --from=build /build/chat-service/target/chat-service.jar /app/chat-service.jar

USER loxia
EXPOSE 8085

ENTRYPOINT ["java", "-jar", "/app/chat-service.jar"]
