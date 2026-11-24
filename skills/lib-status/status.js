import { db } from '../lib-db/db.js';

export const status = {
  // Set agent status + log event
  setStatus: async (agentId, status, detail = '') => {
    const validStatuses = ['working', 'idle', 'sleep', 'error'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Log to agent_events for dashboard realtime
    await db.events.log(agentId, status, detail);
    
    // Also update agent record if needed (optional)
    // await db.agents.upsert({ id: agentId, status, status_detail: detail, status_updated: new Date().toISOString() });
    
    return { agent_id: agentId, status, detail, updated_at: new Date().toISOString() };
  },

  // Get latest status from events
  getStatus: async (agentId) => {
    if (process.env.DB_MODE === 'sqlite') {
      const Database = (await import('better-sqlite3')).default;
      const dbSqlite = new Database('C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db');
      const row = dbSqlite.prepare(`
        SELECT agent_id, event as status, message as detail, created_at as updated_at
        FROM agent_events WHERE agent_id=? ORDER BY created_at DESC LIMIT 1
      `).get(agentId);
      dbSqlite.close();
      return row || { agent_id: agentId, status: 'idle', detail: '', updated_at: null };
    }
    
    const { data, error } = await (await import('@supabase/supabase-js')).createClient(
      process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY
    ).from('agent_events')
      .select('agent_id, event, message, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? { agent_id: data.agent_id, status: data.event, detail: data.message, updated_at: data.created_at }
      : { agent_id: agentId, status: 'idle', detail: '', updated_at: null };
  },

  // List all agents with latest status
  listAll: async () => {
    const agents = await db.agents.list(false); // all agents
    const statuses = await Promise.all(agents.map(a => status.getStatus(a.id)));
    return agents.map(a => ({
      ...a,
      status: statuses.find(s => s.agent_id === a.id)?.status || 'idle',
      detail: statuses.find(s => s.agent_id === a.id)?.detail || '',
      updated_at: statuses.find(s => s.agent_id === a.id)?.updated_at || null
    }));
  },

  // Housekeeping: set sleep for idle > 30 min
  housekeeping: async () => {
    const all = await status.listAll();
    const now = new Date();
    const threshold = 30 * 60 * 1000; // 30 min
    
    for (const agent of all) {
      if (agent.status === 'idle' && agent.updated_at) {
        const lastUpdate = new Date(agent.updated_at);
        if (now - lastUpdate > threshold) {
          await status.setStatus(agent.id, 'sleep', 'Inactive >30min (auto-sleep)');
        }
      }
      // Also check stuck tasks >15min
      if (agent.status === 'working' && agent.updated_at) {
        const lastUpdate = new Date(agent.updated_at);
        if (now - lastUpdate > 15 * 60 * 1000) { // 15 min
          await status.setStatus(agent.id, 'error', 'Task timeout >15min (auto-error)');
          // TODO: mark task as failed in db
        }
      }
    }
  }
};

export default status;