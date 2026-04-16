# =====================================================================
# Loxia — catalog-service Dockerfile (multi-stage)
#
# Same pattern as auth-service: stage 1 builds the fat JAR with
# Maven 3.9 on Temurin 21, stage 2 runs it on a slim Temurin 21 JRE
# alpine image as a non-root user.
#
# Build context is `services/` (NOT `services/catalog-service/`) so
# that Docker can see both the parent POM and the catalog-service
# module in the same build context. See docker-compose.yml:
#
#     build:
#       context: ./services
#       dockerfile: catalog-service/Dockerfile
# =====================================================================

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the parent POM and every child module POM. The parent POM
# declares all 4 services under <modules>, so Maven refuses to read
# it unless every module's pom.xml is present on disk — even when
# we only want to build one of them.
COPY pom.xml ./pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY catalog-service/pom.xml ./catalog-service/pom.xml
COPY rental-service/pom.xml ./rental-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml
COPY chat-service/pom.xml ./chat-service/pom.xml

# Warm up the local Maven repository with catalog-service's dependencies.
RUN mvn -q -pl catalog-service -am dependency:go-offline

# Copy sources and build the JAR. Tests are skipped here; they run
# in CI, not in the image build.
COPY catalog-service/src ./catalog-service/src
RUN mvn -q -pl catalog-service -am package -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S loxia && adduser -S loxia -G loxia
WORKDIR /app

COPY --from=build /build/catalog-service/target/catalog-service.jar /app/catalog-service.jar

USER loxia
EXPOSE 8082

ENTRYPOINT ["java", "-jar", "/app/catalog-service.jar"]
