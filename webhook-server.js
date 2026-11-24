// Webhook HTTP Server for Evolution API
// Run: node webhook-server.js
// Receives POST from Evolution API on /webhook/wa-incoming

import { createServer } from 'http';
import { router } from './skills/core-router/router.js';
import { wa } from './skills/lib-wa/wa.js';

const PORT = process.env.WEBHOOK_PORT || 3001;
const WEBHOOK_PATH = '/webhook/wa-incoming';

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  
  if (req.method !== 'POST' || req.url !== WEBHOOK_PATH) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      console.log(`[${new Date().toISOString()}] Webhook received:`, payload.event);
      
      const result = await router.receive(payload);
      console.log(`[${new Date().toISOString()}] Result:`, result.status);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
    } catch (err) {
      console.error('Webhook error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}${WEBHOOK_PATH}`);
  console.log(`📱 Configure Evolution API webhook to: http://localhost:${PORT}${WEBHOOK_PATH}`);
  console.log(`   Or use Cloudflare Tunnel: npm run tunnel`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});

export default server;