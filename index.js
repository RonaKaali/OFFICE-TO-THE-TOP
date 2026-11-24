// Main Entry Point - OFFICE TO THE TOP
// Run: node index.js
// Starts: Evolution API (external), Webhook Server, Housekeeping Cron

import { wa } from './skills/lib-wa/wa.js';
import { status } from './skills/lib-status/status.js';
import { router } from './skills/core-router/router.js';

// Start webhook server (dynamic import to avoid circular)
const { default: webhookServer } = await import('./webhook-server.js');

console.log('╔══════════════════════════════════════════╗');
console.log('║     OFFICE TO THE TOP - STARTING        ║');
console.log('║   Multi-Agent WhatsApp System (Local)   ║');
console.log('╚══════════════════════════════════════════╝');

// Verify Evolution API
async function verifyEvolution() {
  try {
    const state = await wa.getInstanceState();
    console.log('📱 Evolution API:', state.instance?.state || 'unknown');
    if (state.instance?.state !== 'open') {
      console.log('⚠️  WhatsApp not connected. Scan QR at http://localhost:8080/manager');
    }
  } catch (err) {
    console.error('❌ Evolution API unreachable:', err.message);
    console.log('   Start Evolution API: cd evolution-api && npm start');
  }
}

// Housekeeping cron (every 10 min)
function startHousekeeping() {
  setInterval(async () => {
    console.log('[Housekeeping] Running...');
    try {
      await status.housekeeping();
      console.log('[Housekeeping] Done');
    } catch (err) {
      console.error('[Housekeeping] Error:', err.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
  
  // Run once on start
  setTimeout(() => status.housekeeping(), 5000);
}

// Start
await verifyEvolution();
startHousekeeping();

console.log('');
console.log('✅ System ready!');
console.log('📥 Webhook: http://localhost:3001/webhook/wa-incoming');
console.log('📱 Evolution Manager: http://localhost:8080/manager');
console.log('🌐 Public tunnel: npm run tunnel');
console.log('');
console.log('Press Ctrl+C to stop');

// Keep alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down OFFICE TO THE TOP...');
  process.exit(0);
});