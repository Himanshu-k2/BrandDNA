import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Allow only the Figma Make preview origin when running inside Figma.
function figmaPreviewHost() {
  const value = process.env.FIGMA ? process.env.FIGMA_PUBLIC_URL : undefined;
  if (!value) return undefined;
  try {
    return [new URL(value).hostname];
  } catch {
    return [value];
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    host: true,
    allowedHosts: figmaPreviewHost()
  }
});
