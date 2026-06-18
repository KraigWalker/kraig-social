import { reactRouter } from '@react-router/dev/vite';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { defineConfig, loadConfigFromFile, mergeConfig } from 'vite';

export default defineConfig(async ({ command, mode }) => {
  const baseConfig = {
    root: process.cwd(),
    plugins: [reactRouter()],
    build: {
      modulePreload: { polyfill: false },
    },
  };
  const localConfigPath = path.join(process.cwd(), 'vite.app.config.ts');

  if (!existsSync(localConfigPath)) {
    return baseConfig;
  }

  const loaded = await loadConfigFromFile({ command, mode }, localConfigPath);
  return loaded ? mergeConfig(baseConfig, loaded.config) : baseConfig;
});
