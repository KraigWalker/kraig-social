import { federation } from '@module-federation/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  ssr: {
    external: [
      '@module-federation/runtime',
      '@module-federation/runtime-core',
      '@module-federation/sdk',
      '@module-federation/vite/ssrEntryLoader',
    ],
  },
  plugins: [
    federation({
      name: 'kraig_social_host',
      remotes: {},
      shared: {},
      hostInitInjectLocation: 'entry',
      manifest: false,
    }),
  ],
});
