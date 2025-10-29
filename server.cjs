const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  try {
    let filepath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
    try {
      const stat = fs.statSync(filepath);
      if (stat.isDirectory()) {
        filepath = path.join(filepath, 'index.html');
      }
      
      const ext = path.extname(filepath);
      const content = fs.readFileSync(filepath);
      const type = mime[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    } catch (err) {
      // 404 - serve index.html for SPA routing
      try {
        const fallbackPath = path.join(__dirname, 'dist', 'index.html');
        const content = fs.readFileSync(fallbackPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  } catch (err) {
    console.error('Request error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying another port...`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(PORT, HOST, () => {
  console.log(`✓ TS-404 Synthesizer running on http://localhost:${PORT}`);
  console.log(`✓ Server is listening on ${HOST}:${PORT}`);
});
