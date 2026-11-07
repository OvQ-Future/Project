FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4173 \
    HOST=0.0.0.0 \
    DATA_DIR=/app/data

RUN apk add --no-cache su-exec

COPY --chown=node:node package.json server.js docker-entrypoint.sh ./
COPY --chown=node:node public ./public
COPY --chown=node:node data ./data

RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
