import * as client from 'prom-client';

// Create a Registry to register metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // in seconds
});

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeWebSocketConnections = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const wsEventCounter = new client.Counter({
  name: 'websocket_events_total',
  help: 'Total number of WebSocket events',
  labelNames: ['event_type']
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(activeWebSocketConnections);
register.registerMetric(wsEventCounter);

// Export metrics
export const promClient = {
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  activeWebSocketConnections,
  wsEventCounter
};

// Middleware to track HTTP metrics
export const httpMetricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Record end time and calculate duration on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
    
    // Observe request duration
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration / 1000 // Convert to seconds
    );
  });
  
  next();
};