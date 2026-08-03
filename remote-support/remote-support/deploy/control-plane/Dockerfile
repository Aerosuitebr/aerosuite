FROM node:24.9.0-alpine
WORKDIR /app
COPY tools/dev-server.mjs ./tools/dev-server.mjs
COPY apps/operator-console ./apps/operator-console
RUN mkdir /data && chown node:node /data
ENV HOST=0.0.0.0
ENV PORT=8080
ENV AEROSUPPORT_DB_PATH=/data/control-plane.db
EXPOSE 8080
USER node
CMD ["node", "tools/dev-server.mjs"]
