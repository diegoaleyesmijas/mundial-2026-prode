import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/football-data/matches': {
          target: 'https://api.football-data.org/v4',
          changeOrigin: true,
          secure: true,
          rewrite: () => '/competitions/WC/matches',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const footballApiKey = env.FOOTBALL_API_KEY || env.VITE_FOOTBALL_API_KEY;
              if (footballApiKey) {
                proxyReq.setHeader('X-Auth-Token', footballApiKey);
              }
            });
          },
        },
      },
    },
  };
});
