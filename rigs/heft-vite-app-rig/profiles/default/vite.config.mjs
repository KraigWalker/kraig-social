import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  root: process.cwd(),
  plugins: [reactRouter()],
  build: {
    modulePreload: { polyfill: false },
  },
});
