import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const version = process.env.DISPATCH_PANEL_VERSION ?? '1.1.0';
const target = process.env.DISPATCH_PANEL_TARGET ?? 'browser';
const federationName = `dispatch_panel_${version.replaceAll('.', '_')}`;
const isServer = target === 'server';
const outputDirectory = `dist/releases/${version}/${target}`;
const publicOrigin =
  process.env.REMOTE_PUBLIC_ORIGIN ?? (isServer ? 'http://localhost:3001' : '/__gateway');
const publicPath = `${publicOrigin}/mf/releases/${version}/${target}/`;

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: federationName,
      filename: 'remoteEntry.js',
      exposes: {
        './DispatchPanel': './src/DispatchPanel.tsx',
        './mount': './src/mount.tsx',
      },
      shared: {
        react: {
          singleton: true,
          strictVersion: true,
          requiredVersion: '19.2.7',
        },
        'react-dom': {
          singleton: true,
          strictVersion: true,
          requiredVersion: '19.2.7',
        },
        'react-dom/client': {
          singleton: true,
          strictVersion: true,
          requiredVersion: '19.2.7',
        },
        'react/jsx-runtime': {
          singleton: true,
          strictVersion: true,
          requiredVersion: '19.2.7',
        },
      },
      manifest: {
        fileName: isServer ? 'mf-manifest.json' : 'mf-manifest.json',
        disableAssetsAnalyze: false,
        additionalData: ({ stats }) => {
          const metadata =
            stats.metaData && typeof stats.metaData === 'object' ? stats.metaData : {};
          stats.metaData = {
            ...metadata,
            releaseVersion: version,
            target,
          };
        },
      },
      dts: {
        generateTypes: {
          abortOnError: true,
        },
      },
      publicPath,
      target: isServer ? 'node' : 'web',
      dev: {
        remoteHmr: true,
      },
    }),
  ],
  define: {
    'import.meta.env.DISPATCH_PANEL_VERSION': JSON.stringify(version),
  },
  base: publicPath,
  server: {
    port: 3002,
    origin: 'http://localhost:3002',
    cors: true,
  },
  build: {
    outDir: outputDirectory,
    emptyOutDir: false,
    target: 'es2022',
    modulePreload: false,
    sourcemap: true,
    ssr: isServer ? 'src/index.ts' : false,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
});
