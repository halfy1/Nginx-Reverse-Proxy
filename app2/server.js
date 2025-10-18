const express = require('express');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.APP_PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'unknown';
const HOSTNAME = os.hostname();
const START_TIME = Date.now();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// Request counter for demonstrating load balancing
let requestCounter = 0;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'app2-node',
    instance: INSTANCE_ID,
    hostname: HOSTNAME,
    uptime: (Date.now() - START_TIME) / 1000
  });
});

// Main page
app.get('/', (req, res) => {
  requestCounter++;
  res.json({
    message: 'Welcome to App2 (Node.js)',
    instance: INSTANCE_ID,
    hostname: HOSTNAME,
    requestsHandled: requestCounter,
    endpoints: {
      health: '/health',
      info: '/info',
      api: '/api/*',
      slow: '/slow?delay=seconds',
      cached: '/cached'
    }
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'app2-node',
    instance: INSTANCE_ID,
    hostname: HOSTNAME,
    requestsHandled: requestCounter,
    clientIp: req.ip,
    headers: req.headers,
    method: req.method,
    path: req.path,
    timestamp: Date.now()
  });
});

// API endpoints (rate limited by Nginx)
app.get('/api/data', (req, res) => {
  requestCounter++;
  res.json({
    message: 'API data response',
    instance: INSTANCE_ID,
    data: {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ]
    },
    timestamp: Date.now()
  });
});

app.post('/api/data', (req, res) => {
  requestCounter++;
  res.status(201).json({
    message: 'Data created',
    instance: INSTANCE_ID,
    received: req.body,
    timestamp: Date.now()
  });
});

// Slow endpoint for testing
app.get('/slow', (req, res) => {
  const delay = parseInt(req.query.delay) || 2;
  setTimeout(() => {
    res.json({
      message: `Delayed response after ${delay} seconds`,
      instance: INSTANCE_ID,
      hostname: HOSTNAME
    });
  }, delay * 1000);
});

// Cached endpoint
app.get('/cached', (req, res) => {
  res.json({
    message: 'This response should be cached by Nginx',
    instance: INSTANCE_ID,
    hostname: HOSTNAME,
    timestamp: Date.now(),
    cacheHint: 'If instance ID does not change, load balancing is working!'
  });
});

// Error endpoint
app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Simulated error', instance: INSTANCE_ID });
});

// Load balancing test endpoint
app.get('/lb-test', (req, res) => {
  requestCounter++;
  res.json({
    message: 'Load balancing test',
    instance: INSTANCE_ID,
    hostname: HOSTNAME,
    requestNumber: requestCounter,
    hint: 'Refresh multiple times to see different instances handle requests'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    instance: INSTANCE_ID,
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    instance: INSTANCE_ID,
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`App2 (Node.js) - Instance ${INSTANCE_ID} running on port ${PORT}`);
  console.log(`Hostname: ${HOSTNAME}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});