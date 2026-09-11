import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        configure: (proxy) => {
          // Rewrite Origin header to match backend CORS allowed origins.
          // Browser always sends Origin on POST even for same-origin proxy requests (RFC 6454).
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:8080');
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'frappe-gantt/dist/frappe-gantt.css': path.resolve(__dirname, './node_modules/frappe-gantt/dist/frappe-gantt.css'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Function-based manualChunks: handles transitive deps automatically.
        // String-map manualChunks only splits the listed entry points;
        // their internal dependencies still end up in the main bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // 스타일시트는 청크를 강제하지 않는다 — 이름을 돌려주면 그 CSS 가 독립 청크가 되어,
          // 그것을 import 하던 JS 가 트리셰이킹으로 사라져도 스타일시트만 산출물에 남는다.
          if (id.endsWith('.css')) return;

          // Heavy editors — loaded lazily via componentRegistry
          if (id.includes('@univerjs') || id.includes('univer')) return 'editor-univer';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor-tiptap';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'editor-monaco';

          // Data-heavy libraries
          if (id.includes('exceljs') || id.includes('xlsx')) return 'exceljs';
          if (id.includes('ag-grid')) return 'ag-grid';
          if (id.includes('frappe-gantt')) return 'gantt';
          if (id.includes('chart.js') || id.includes('chartjs')) return 'chartjs';

          // Ant Design + rc-* + @rc-component/* components (large, split from main bundle)
          if (id.includes('antd') || id.includes('@ant-design') || id.includes('/rc-') || id.includes('@rc-component')) return 'antd-vendor';

          // React core — must include react/ itself, not just react-dom
          if (/[/\\]node_modules[/\\](react|react-dom|react-router(?:-dom)?|scheduler)[/\\]/.test(id)) return 'react-vendor';

          // State & data fetching
          if (id.includes('zustand') || id.includes('@tanstack') || id.includes('axios')) return 'state-vendor';

          // Remaining node_modules → vendor bundle
          return 'vendor';
        },
      },
    },
  },
})
