FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy engine (shared) and server code
COPY src/engine/ src/engine/
COPY src/server/ src/server/
COPY tsconfig.server.json ./

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npx", "tsx", "src/server/index.ts"]
