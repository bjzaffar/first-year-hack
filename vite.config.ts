import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { port } from './src/server/config.js';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const apiPort = port(env.API_PORT, 3001);
  return {
    plugins: [react()],
    server: { host: '127.0.0.1', port: port(env.WEB_PORT, 5173), strictPort: true,
      proxy: { '/api': `http://127.0.0.1:${apiPort}` } },
    preview: { host: '127.0.0.1', port: port(env.WEB_PORT, 5173), strictPort: true },
    build: { outDir: 'dist/client' },
  };
});
