import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    outDir: "dist",
    rollupOptions: {
      input: "src/service-worker.ts",
      output: {
        entryFileNames: "service-worker.js",
        format: "es",
      },
    },
    sourcemap: true,
    target: "es2022",
  },
});
