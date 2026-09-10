import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
                return 'vendor-pdfjs';
              }
              if (id.includes('tesseract.js')) {
                return 'vendor-tesseract';
              }
              if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('docx') || id.includes('html2canvas')) {
                return 'vendor-docgen';
              }
              if (id.includes('xlsx') || id.includes('jszip') || id.includes('papaparse')) {
                return 'vendor-sheet-data';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'vendor-ui';
              }
            }
          },
        },
      },
    },
  };
});
