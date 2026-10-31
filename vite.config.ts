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
  plugins: [
    react(),
    tailwindcss(),
  ],
});
