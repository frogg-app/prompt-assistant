FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
RUN mkdir -p /app/backend/public
COPY --from=frontend-builder /app/frontend/dist /app/backend/public

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV COPILOT_CLI_VERSION=v0.0.384
ENV CLAUDE_CODE_VERSION=2.1.11
ENV DISABLE_AUTOUPDATER=1
RUN apt-get update && apt-get install -y --no-install-recommends \
  bash \
  ca-certificates \
  curl \
  ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://gh.io/copilot-install | VERSION="$COPILOT_CLI_VERSION" bash
RUN curl -fsSL https://claude.ai/install.sh | bash -s -- "$CLAUDE_CODE_VERSION" \
  && cp /root/.local/bin/claude /usr/local/bin/claude \
  && chmod +x /usr/local/bin/claude

COPY --from=backend-builder /app/backend /app
RUN groupadd -r app && useradd -r -g app -m -d /home/app app && chown -R app:app /app \
  && mkdir -p /home/app/.copilot \
  && echo '{\"trusted_folders\":[\"/tmp\"]}' > /home/app/.copilot/config.json \
  && chown -R app:app /home/app/.copilot
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
