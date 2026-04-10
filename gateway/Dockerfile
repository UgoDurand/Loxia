# =====================================================================
# Loxia — gateway Dockerfile (multi-stage)
#
# Stage 1 (build) : Maven + JDK 21 — downloads deps, builds fat JAR.
# Stage 2 (run)   : slim Temurin 21 JRE — runs the JAR as non-root.
#
# Unlike the business microservices, the gateway has its own standalone
# pom.xml (it does not inherit from services/pom.xml), so the build
# context is simply `./gateway` — no need to reference sibling modules.
# =====================================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the POM first to warm up the dependency cache. As long as
# pom.xml does not change, Docker reuses this layer on subsequent builds.
COPY pom.xml ./pom.xml
RUN mvn -q dependency:go-offline

# Copy sources and build the fat JAR (tests run in CI, not here).
COPY src ./src
RUN mvn -q package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Dedicated non-root user — mirrors the other service Dockerfiles.
RUN addgroup -S loxia && adduser -S loxia -G loxia
WORKDIR /app

COPY --from=build /build/target/gateway.jar /app/gateway.jar

USER loxia
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/gateway.jar"]
