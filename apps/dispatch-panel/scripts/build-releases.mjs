import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const vite = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const releases = ['1.0.0', '1.1.0'];

function runBuild(version, target) {
  return new Promise((resolve, reject) => {
    const child = spawn(vite, ['build'], {
      cwd: root,
      env: {
        ...process.env,
        DISPATCH_PANEL_VERSION: version,
        DISPATCH_PANEL_TARGET: target,
      },
      shell: false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (signal) {
        reject(new Error(`vite build was terminated by ${signal}`));
      } else if (code) {
        reject(new Error(`vite build exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

await rm(path.join(root, 'dist'), { recursive: true, force: true });

for (const version of releases) {
  await runBuild(version, 'browser');
  await runBuild(version, 'server');
}
