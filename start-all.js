import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const workspaceRoot = path.resolve(path.dirname(__filename));
const backendDir = path.join(workspaceRoot, 'DevGram', 'Backend');
const frontendDir = path.join(workspaceRoot, 'DevGram', 'FrontEnd', 'FRONTEND');
const frontendVitePath = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

console.log('🚀 Starting DevGram Fullstack Environment...');

// Start Backend
const backend = spawn(process.execPath, ['src/server.js'], {
  cwd: backendDir,
  shell: false,
  env: { ...process.env }
});

// Start Frontend
const frontendCommand = fs.existsSync(frontendVitePath)
  ? process.execPath
  : 'npx';
const frontendArgs = fs.existsSync(frontendVitePath)
  ? [frontendVitePath]
  : ['vite'];
const frontendShell = fs.existsSync(frontendVitePath) ? false : true;

const frontend = spawn(frontendCommand, frontendArgs, {
  cwd: frontendDir,
  shell: frontendShell,
  env: { ...process.env }
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.log(`\x1b[36m[Backend]\x1b[0m ${line}`);
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.error(`\x1b[31m[Backend ERROR]\x1b[0m ${line}`);
  });
});

backend.on('close', (code) => {
  console.log(`\x1b[33m[Backend] exited with code ${code}\x1b[0m`);
  cleanup();
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.log(`\x1b[32m[Frontend]\x1b[0m ${line}`);
  });
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.error(`\x1b[31m[Frontend ERROR]\x1b[0m ${line}`);
  });
});

frontend.on('close', (code) => {
  console.log(`\x1b[33m[Frontend] exited with code ${code}\x1b[0m`);
  cleanup();
});

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('Shutting down backend and frontend processes...');
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
