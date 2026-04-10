# =====================================================================
# Loxia — auth-service Dockerfile (multi-stage)
#
# Stage 1 (build) : uses a Maven + JDK 21 image to build the fat JAR.
# Stage 2 (run)   : uses a slim Temurin 21 JRE image to run the JAR.
#
# Build context is `services/` (NOT `services/auth-service/`) so that
# Docker can see both the parent POM and the auth-service module in
# the same build context. See docker-compose.yml:
#
#     build:
#       context: ./services
#       dockerfile: auth-service/Dockerfile
# =====================================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the parent POM first so Maven can resolve it.
COPY pom.xml ./pom.xml

# Copy the module's POM next. This layer is cached unless the POM
# changes, which is the classic Maven Docker optimization for
# dependency download.
COPY auth-service/pom.xml ./auth-service/pom.xml

# Warm up the local Maven repository with all dependencies. This step
# is cached as long as the POMs above don't change.
RUN mvn -q -pl auth-service -am dependency:go-offline

# Now copy the actual sources and build the JAR. Tests are skipped
# here because they run in CI, not in the image build.
COPY auth-service/src ./auth-service/src
RUN mvn -q -pl auth-service -am package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create a dedicated non-root user to run the JVM.
RUN addgroup -S loxia && adduser -S loxia -G loxia
WORKDIR /app

# Copy the fat JAR produced by the build stage.
COPY --from=build /build/auth-service/target/auth-service.jar /app/auth-service.jar

# wget is needed by the Docker HEALTHCHECK defined in docker-compose.yml
# (it hits /actuator/health). It is already provided by alpine base.

USER loxia
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/auth-service.jar"]
