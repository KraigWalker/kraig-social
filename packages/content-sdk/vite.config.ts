export default {
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    modulePreload: { polyfill: false },
    sourcemap: true,
    target: 'es2022',
  },
};
