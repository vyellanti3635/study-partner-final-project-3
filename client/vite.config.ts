import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update the service worker when a new build is deployed.
      registerType: 'autoUpdate',
      // Inject the service worker registration script into index.html automatically.
      injectRegister: 'auto',

      // Web App Manifest — satisfies Req 12.1
      manifest: {
        name: 'StudyPartner',
        short_name: 'StudyPartner',
        description: 'Manage your academic tasks across all your subjects in one place.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111111',
        lang: 'en',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Maskable icon — required for Lighthouse PWA score >= 90
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // Workbox configuration — satisfies Req 12.2, 12.5, Property 14
      workbox: {
        // Precache all JS, CSS, HTML, images, fonts produced by the build.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],

        // Navigate fallback: any navigation request that isn't an API call
        // and isn't matched by a precached file will serve index.html.
        // This allows client-side routing to work when offline.
        navigateFallback: '/index.html',

        // CRITICAL: Never serve index.html for /api/* navigation requests.
        // This ensures API calls fail at the network layer when offline
        // rather than receiving a cached HTML response (design.md, Req 12.5).
        navigateFallbackDenylist: [/^\/api\//],

        // No runtime caching for API responses.
        // We explicitly do not cache /api/* to avoid stale-data bugs (Req 12.5).
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
