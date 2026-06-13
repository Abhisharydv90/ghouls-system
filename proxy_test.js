const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;
const TARGET_URL = 'http://example.com';

// Proxy middleware
app.use('/', (req, res, next) => {
  console.log(`Incoming request URL: ${req.originalUrl}`);
  next();
}, createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Log details about the outgoing proxy request if needed
    // console.log(`Proxying request from ${req.ip} to ${TARGET_URL}${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log details about the incoming proxy response if needed
    // console.log(`Received response from ${TARGET_URL}${req.originalUrl} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy Error');
  }
}));

app.listen(PORT, () => {
  console.log(`Reverse proxy listening on port ${PORT} and forwarding to ${TARGET_URL}`);
});
