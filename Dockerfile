# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# 개발 도구(좌측 레일 🔧) 노출 여부. 기본 false — 운영 이미지에는 포함되지 않는다.
# 개발/스테이징 이미지에서만 켠다:
#   docker build --build-arg VITE_ENABLE_DEV_TOOLS=true .
# true 로 빌드하면 내부 API 레퍼런스(GuideInternalApi) 등이 번들에 포함되므로
# 외부 공개 환경에서는 절대 켜지 말 것.
ARG VITE_ENABLE_DEV_TOOLS=false
ENV VITE_ENABLE_DEV_TOOLS=$VITE_ENABLE_DEV_TOOLS

# VITE_API_BASE_URL은 빈 값 유지 → 브라우저는 상대경로 /api 호출 → nginx가 backend로 프록시
RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
