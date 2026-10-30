import { defineConfig } from '@hey-api/openapi-ts';

// Support .env and .env.local in Node 20+
['.env', '.env.local'].forEach((file) => {
  try {
    process.loadEnvFile(file);
  } catch {
    // Ignore missing files
  }
});

const inputUrl =
  process.env.VITE_SWAGGER_URL ||
  process.env.SWAGGER_URL ||
  (process.env.VITE_API_BASE_URL
    ? `${process.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/v3/api-docs`
    : 'http://192.168.47.250:8080/v3/api-docs');

export default defineConfig({
  input: inputUrl,
  output: 'src/api/generated',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@hey-api/client-axios',
  ],
});
