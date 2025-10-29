#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const MAX_RETRIES = 5;
let retries = 0;

function startServer() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Starting TS-404 Server (Attempt ${retries + 1}/${MAX_RETRIES})`);
  console.log(`${'='.repeat(50)}\n`);

  const server = spawn('node', ['server.cjs'], {
    cwd: __dirname,
    stdio: 'inherit',
    detached: false,
  });

  server.on('exit', (code, signal) => {
    if (code === 0) {
      console.log('\nServer shut down gracefully');
      process.exit(0);
    } else {
      retries++;
      if (retries < MAX_RETRIES) {
        console.error(`\nServer crashed with code ${code}, signal ${signal}`);
        console.log(`Restarting in 2 seconds...`);
        setTimeout(startServer, 2000);
      } else {
        console.error(`\nServer crashed after ${MAX_RETRIES} attempts. Giving up.`);
        process.exit(1);
      }
    }
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    retries++;
    if (retries < MAX_RETRIES) {
      console.log('Retrying in 2 seconds...');
      setTimeout(startServer, 2000);
    }
  });
}

// Start the server
startServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT, stopping server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nReceived SIGTERM, stopping server...');
  process.exit(0);
});
