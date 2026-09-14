/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 베이스 URL. 빈 값이면 상대경로 `/api` → dev 는 Vite 프록시, 배포는 nginx 프록시 */
  readonly VITE_API_BASE_URL: string;
  /**
   * 개발 도구(좌측 레일 🔧) 노출 여부. 빌드 시점에 리터럴로 치환된다.
   * `pnpm dev` 는 이 값과 무관하게 항상 노출된다 (menuConfig.ts 의 DEV_TOOLS_ENABLED 참조).
   * 운영 이미지에서는 절대 'true' 로 빌드하지 말 것.
   */
  readonly VITE_ENABLE_DEV_TOOLS?: string;
  /** Swagger / OpenAPI docs URL */
  readonly VITE_SWAGGER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
