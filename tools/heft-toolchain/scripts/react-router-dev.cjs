#!/usr/bin/env node
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = process.cwd();
const viteConfig = require.resolve('@kraigwalker/heft-vite-app-rig/profiles/default/vite.config.mjs', {
  paths: [projectRoot],
});
const executable = process.platform === 'win32' ? 'react-router.cmd' : 'react-router';
const command = path.join(projectRoot, 'node_modules', '.bin', executable);

const child = spawn(command, ['dev', projectRoot, '--config', viteConfig, '--host', ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
