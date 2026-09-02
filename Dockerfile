FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_CAM_PUBLIC_BASE_URL
ENV VITE_CAM_PUBLIC_BASE_URL=${VITE_CAM_PUBLIC_BASE_URL}
RUN pnpm build


FROM caddy:2-alpine

WORKDIR /srv

# Caddy reads this value at runtime to proxy browser requests from /api.
ARG CAM_UPSTREAM_BASE_URL
ENV CAM_UPSTREAM_BASE_URL=${CAM_UPSTREAM_BASE_URL}

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
