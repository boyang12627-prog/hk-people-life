/**
 * Standalone build for GitHub Pages and local dev. Lives in standalone/ so it never collides with the
 * original hosting platform's own config. `@/lib/auth/provider` and `@/components/preview-host-bridge`
 * resolve to local shims here only; everything else under `@/` is the real src/.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const src = fileURLToPath(new URL("../src", import.meta.url));

export default defineConfig(({ command, isPreview }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: process.env.PAGES_BASE ?? (command === "build" || isPreview ? "/hk-people-life/" : "/"),
  publicDir: fileURLToPath(new URL("../public", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@/lib/auth/provider", replacement: `${src}/shims/lib/auth/provider.tsx` },
      { find: "@/components/preview-host-bridge", replacement: `${src}/shims/components/preview-host-bridge.tsx` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL("../dist", import.meta.url)),
    emptyOutDir: true,
  },
}));
