import { spawn } from 'child_process';

console.log('Starting Vite development server...');
const child = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

child.on('exit', (code) => {
  console.log(`Vite exited with code ${code}`);
});
