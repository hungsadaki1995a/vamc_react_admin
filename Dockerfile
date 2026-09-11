# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# 패키지 매니저는 package.json 의 packageManager 필드가 정한다.
# corepack 이 그 버전을 내려받아 쓰므로 개발자·CI 가 서로 다른 pnpm 을 쓸 일이 없다.
RUN corepack enable

# pnpm-workspace.yaml 도 함께 복사한다 — allowBuilds 설정이 여기 있고,
# 빠지면 esbuild 의 빌드 스크립트가 차단되어 install 이 exit 1 로 실패한다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile 은 npm ci 에 해당한다. 락파일과 package.json 이 어긋나면
# 빌드를 세운다 — CI 에서 의존성이 조용히 바뀌는 것을 막는다.
RUN pnpm install --frozen-lockfile

COPY . .

# 개발 도구(좌측 레일 🔧) 노출 여부. 기본 false — 운영 이미지에는 포함되지 않는다.
# 개발/스테이징 이미지에서만 켠다:
#   docker build --build-arg VITE_ENABLE_DEV_TOOLS=true .
# true 로 빌드하면 내부 API 레퍼런스(GuideInternalApi) 등이 번들에 포함되므로
# 외부 공개 환경에서는 절대 켜지 말 것.
ARG VITE_ENABLE_DEV_TOOLS=false
ENV VITE_ENABLE_DEV_TOOLS=$VITE_ENABLE_DEV_TOOLS

# VITE_API_BASE_URL은 빈 값 유지 → 브라우저는 상대경로 /api 호출 → nginx가 backend로 프록시
RUN pnpm build

# Stage 2: Serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
