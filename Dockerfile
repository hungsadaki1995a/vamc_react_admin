# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Package manager is determined by the packageManager field in package.json.
# corepack downloads and uses that version so developers and CI never use different pnpm versions.
RUN corepack enable

# Copy pnpm-workspace.yaml as well — allowBuilds config lives here,
# without it, esbuild's build script is blocked and install fails with exit 1.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile is the equivalent of npm ci. If the lockfile and package.json diverge,
# it halts the build — preventing dependencies from silently changing in CI.
RUN pnpm install --frozen-lockfile

COPY . .

# Keep VITE_API_BASE_URL empty → browser calls relative /api → nginx proxies to backend
RUN pnpm build

# Stage 2: Serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
