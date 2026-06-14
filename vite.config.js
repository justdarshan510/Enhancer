import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8000,
    proxy: {
      '/api-replicate': {
        target: 'https://api.replicate.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-replicate/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        }
      },
      '/api-local': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-local/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('local proxy error', err);
          });
        }
      }
    }
  }
});
