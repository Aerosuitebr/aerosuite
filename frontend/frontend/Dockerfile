# Build Angular
FROM node:20 AS build
WORKDIR /app

# Clear npm cache and set registry
RUN npm cache clean --force

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with optimizations
RUN npm install --no-audit --no-fund

# Copy Angular configuration files
COPY angular.json tsconfig.json tsconfig.app.json proxy.conf.json ./

# Copy source code (exclude Java files via .dockerignore)
COPY src ./src

# Remove any Java files that might have been copied
RUN find ./src -name "*.java" -type f -delete 2>/dev/null || true && \
    rm -rf ./src/main 2>/dev/null || true && \
    rm -rf ./src/test/java 2>/dev/null || true

# Build the application
RUN npm run build

# Serve with Nginx
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/aerosuite-frontend /usr/share/nginx/html
COPY maintenance/index.html /usr/share/nginx/html/maintenance.html
RUN mkdir -p /etc/nginx/maintenance
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
