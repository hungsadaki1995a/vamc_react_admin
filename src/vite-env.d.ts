/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Empty string calls relative `/api` → Vite proxy in dev, nginx proxy in production */
  readonly VITE_API_BASE_URL: string;
  /** Swagger / OpenAPI docs URL */
  readonly VITE_SWAGGER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
