# =====================================================================
# Loxia — frontend Dockerfile (multi-stage)
#
# Stage 1 (build) : Node 20 Alpine — installs deps and runs Vite build.
# Stage 2 (run)   : Nginx Alpine    — serves the static build output.
#
# The nginx.conf at the repository root is copied in to enable:
#   - SPA fallback (try_files → index.html) for React Router
#   - Static asset caching for Vite-hashed bundles
#   - /health endpoint for the Docker HEALTHCHECK
# =====================================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first to cache the npm install layer.
# Re-runs only when package.json or package-lock.json change.
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build the production bundle.
COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM nginx:alpine AS runtime

# Replace the default Nginx config with ours (SPA fallback + health).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite production output into Nginx's serving directory.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
