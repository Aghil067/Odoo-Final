/**
 * vite.config.ts
 * Vite build configuration for Solar Installation Management System.
 *
 * Plugins:
 *  @vitejs/plugin-react   → React JSX transform + Fast Refresh
 *  @tailwindcss/vite      → Tailwind CSS v4 (no postcss.config.js needed)
 */

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server:{proxy:{'/api':{target:'http://127.0.0.1:3000',changeOrigin:false}}},
  plugins: [
    react(),
    tailwindcss(),
  ],
});
