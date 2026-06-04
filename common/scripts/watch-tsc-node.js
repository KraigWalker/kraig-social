#!/usr/bin/env node

const { spawn } = require("node:child_process");
const { existsSync, watch } = require("node:fs");
const path = require("node:path");

const entry = path.resolve(process.argv[2] ?? "dist/index.js");
const outDir = path.dirname(entry);
const tscBin = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsc.cmd" : "tsc",
);
const debounceMs = 150;

let server;
let restartTimer;
let watcher;
let ready = false;

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    stdio: options.stdio ?? "inherit",
    shell: process.platform === "win32",
    ...options,
  });
}

function stopServer() {
  if (!server) {
    return;
  }

  server.kill("SIGTERM");
  server = undefined;
}

function startServer() {
  if (!existsSync(entry)) {
    return;
  }

  stopServer();
  server = spawnCommand("node", [entry]);
}

function scheduleRestart() {
  if (!ready) {
    return;
  }

  clearTimeout(restartTimer);
  restartTimer = setTimeout(startServer, debounceMs);
}

function watchOutput() {
  if (watcher || !existsSync(outDir)) {
    return;
  }

  try {
    watcher = watch(outDir, { recursive: true }, scheduleRestart);
  } catch {
    watcher = watch(entry, scheduleRestart);
  }
}

const tsc = spawnCommand(
  existsSync(tscBin) ? tscBin : "tsc",
  ["-p", "tsconfig.json", "--watch", "--preserveWatchOutput"],
  { stdio: ["ignore", "pipe", "pipe"] },
);

tsc.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

tsc.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);

  if (/Found 0 errors?\. Watching for file changes\./.test(text)) {
    ready = true;
    watchOutput();
    startServer();
  }
});

tsc.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

tsc.on("exit", (code, signal) => {
  stopServer();
  process.exitCode = code ?? (signal ? 1 : 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    watcher?.close();
    stopServer();
    tsc.kill(signal);
  });
}
