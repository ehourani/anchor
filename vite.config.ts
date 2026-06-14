import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service worker silently updates in the background — no nagging prompt.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Anchor',
        short_name: 'Anchor',
        description:
          'A calm place to find the coping skill you need, right now.',
        theme_color: '#2fa6ca',
        background_color: '#f1f9fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell so it opens instantly and works without a
        // connection. Supabase data is intentionally NOT cached here — recovery
        // data stays network-only (offline data sync is a deliberate deferral).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // The standalone legal pages are real, public, non-SPA routes — don't let
        // the SPA navigation fallback (index.html) shadow them.
        navigateFallbackDenylist: [/^\/privacy/, /^\/terms/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
