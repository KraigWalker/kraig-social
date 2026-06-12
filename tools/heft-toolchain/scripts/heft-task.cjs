const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function projectRoot() {
  return process.cwd();
}

function packageRoot() {
  return path.resolve(__dirname, '..');
}

function readConfig(root) {
  const configPath = path.join(root, 'config', 'heft-toolchain.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function isWindows() {
  return process.platform === 'win32';
}

function commandPath(root, command) {
  const executable = isWindows() ? `${command}.cmd` : command;
  return path.join(root, 'node_modules', '.bin', executable);
}

function binPath(root) {
  return path.join(root, 'node_modules', '.bin');
}

function resolveCommand(command, preferToolchain = false) {
  const roots = preferToolchain ? [packageRoot(), projectRoot()] : [projectRoot(), packageRoot()];
  for (const root of roots) {
    const candidate = commandPath(root, command);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return command;
}

function resolvePackagePath(specifier) {
  return require.resolve(specifier, { paths: [projectRoot()] });
}

function reactRouterViteConfigArgs() {
  return ['--config', resolvePackagePath('@kraigwalker/heft-vite-app-rig/profiles/default/vite.config.mjs')];
}

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const pathSeparator = isWindows() ? ';' : ':';
    const env = {
      ...process.env,
      PATH: [
        binPath(projectRoot()),
        binPath(packageRoot()),
        process.env.PATH || '',
      ].join(pathSeparator),
    };

    const child = spawn(resolveCommand(command, options.preferToolchain), args, {
      cwd: projectRoot(),
      env,
      shell: false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} was terminated by ${signal}`));
      } else if (code) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

function tsgoConcurrencyArgs(config, scriptOptions) {
  const mode = process.env.KRAIG_TSGO_MODE || config.tsgoMode || scriptOptions.tsgoMode || 'fast';
  const lowMemory = process.env.KRAIG_LOW_MEMORY === '1' || process.env.CI === 'true';

  if (lowMemory || mode === 'single-threaded') {
    return ['--singleThreaded'];
  }

  const checkers =
    process.env.KRAIG_TSGO_CHECKERS || (mode === 'balanced' ? '2' : undefined) || '4';
  return ['--checkers', checkers];
}

async function runTsgo(args, options, config) {
  await spawnAsync('tsgo', [...tsgoConcurrencyArgs(config, options), ...args]);
}

async function runTool(tool, options, config) {
  switch (tool) {
    case 'react-router-build':
      await spawnAsync('react-router', ['build', projectRoot(), ...reactRouterViteConfigArgs()]);
      break;

    case 'react-router-typegen':
      await spawnAsync('react-router', ['typegen', projectRoot(), ...reactRouterViteConfigArgs()]);
      break;

    case 'vite-build':
      await spawnAsync('vite', ['build'], { preferToolchain: true });
      break;

    case 'vitest':
      await spawnAsync('vitest', ['run'], { preferToolchain: true });
      break;

    case 'tsgo-build':
      await runTsgo([], options, config);
      break;

    case 'tsgo-check':
      await runTsgo(['--noEmit'], options, config);
      break;

    case 'tsgo-declarations':
      await runTsgo(['--emitDeclarationOnly'], options, config);
      break;

    case 'oxlint':
      await spawnAsync('oxlint', ['.'], { preferToolchain: true });
      break;

    case 'oxlint-fix':
      await spawnAsync('oxlint', ['.', '--fix'], { preferToolchain: true });
      break;

    case 'oxfmt-check':
      await spawnAsync('oxfmt', ['--check', '.'], { preferToolchain: true });
      break;

    case 'oxfmt-write':
      await spawnAsync('oxfmt', ['.'], { preferToolchain: true });
      break;

    default:
      throw new Error(`Unknown heft-toolchain tool: ${tool}`);
  }
}

async function runAsync(options) {
  const scriptOptions = options.scriptOptions || {};
  const tool = scriptOptions.tool;
  const config = readConfig(projectRoot());

  if (!tool) {
    throw new Error('heft-toolchain requires scriptOptions.tool');
  }

  await runTool(tool, scriptOptions, config);
}

module.exports = { runAsync };
