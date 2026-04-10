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

# Copy the parent POM and every child module POM. The parent POM
# declares all 4 services under <modules>, so Maven refuses to read
# it unless every module's pom.xml is present on disk — even when
# we only want to build one of them. Copying just the POMs keeps
# this layer cacheable: as long as no pom.xml changes, Docker reuses
# the warmed-up dependency cache below.
COPY pom.xml ./pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY catalog-service/pom.xml ./catalog-service/pom.xml
COPY rental-service/pom.xml ./rental-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml

# Warm up the local Maven repository with auth-service's dependencies.
# `-pl auth-service -am` restricts the build to that module and its
# (non-existent) upstream siblings, so only auth-service's deps are
# actually downloaded.
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
