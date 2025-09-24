# syntax=docker/dockerfile:1.6

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  else npm i --no-audit --no-fund; fi

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8080
# Next reads PORT env var; default Cloud Run uses $PORT
ENV PORT=8080
CMD ["sh","-c","npx next start -p ${PORT:-8080}"]

