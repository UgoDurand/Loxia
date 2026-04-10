# =====================================================================
# Loxia — notification-service Dockerfile (multi-stage)
#
# Same pattern as auth-service: stage 1 builds the fat JAR with
# Maven 3.9 on Temurin 21, stage 2 runs it on a slim Temurin 21 JRE
# alpine image as a non-root user.
#
# Build context is `services/` (NOT `services/notification-service/`)
# so that Docker can see both the parent POM and the notification
# module in the same build context. See docker-compose.yml:
#
#     build:
#       context: ./services
#       dockerfile: notification-service/Dockerfile
# =====================================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the parent POM and every child module POM (parent refuses to
# load unless every declared module's pom.xml is present on disk).
COPY pom.xml ./pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY catalog-service/pom.xml ./catalog-service/pom.xml
COPY rental-service/pom.xml ./rental-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml

RUN mvn -q -pl notification-service -am dependency:go-offline

COPY notification-service/src ./notification-service/src
RUN mvn -q -pl notification-service -am package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S loxia && adduser -S loxia -G loxia
WORKDIR /app

COPY --from=build /build/notification-service/target/notification-service.jar /app/notification-service.jar

USER loxia
EXPOSE 8084

ENTRYPOINT ["java", "-jar", "/app/notification-service.jar"]
