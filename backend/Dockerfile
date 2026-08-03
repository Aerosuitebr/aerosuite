# ===== Build =====
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Maven Central (settings.xml do projeto — sem Nexus corporativo)
COPY pom.xml settings.xml ./
COPY .mvn .mvn

RUN mvn -s settings.xml -U -e -B -DskipTests dependency:go-offline || true

# Copiar código fonte (isso invalida o cache se o código mudar)
COPY src ./src

# Limpar cache do Quarkus para evitar problemas de versão
RUN rm -rf ~/.m2/repository/io/quarkus || true

# Compilar o projeto
RUN mvn -s settings.xml -U -e -B -Dmaven.test.skip=true clean package "-Dquarkus.package.type=uber-jar"

# ===== Run =====
FROM eclipse-temurin:21-jre
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENV QUARKUS_PROFILE=prod
WORKDIR /app
# mysqldump para backup agendado via API (REQ-022 / evidências ANAC)
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-mysql-client \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /workspace/target/*-runner.jar /app/app.jar
EXPOSE 8080
CMD [ "sh", "-c", "java $JAVA_OPTS -jar /app/app.jar" ]
