FROM oven/bun:1.2.5 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.2.5-slim

WORKDIR /app
COPY --from=builder /app/server ./server

CMD ["./server"]
