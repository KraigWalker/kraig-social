export default {
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.jsx'],
    setupFiles: ['./src/test/setup.js'],
  },
};
