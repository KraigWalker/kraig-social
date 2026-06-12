export default {
  build: {
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    outDir: 'dist',
    rollupOptions: {
      input: 'src/shared-worker.ts',
      output: {
        entryFileNames: 'shared-worker.js',
        format: 'es',
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
};
