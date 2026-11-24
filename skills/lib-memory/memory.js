import { db } from '../lib-db/db.js';

export const memory = {
  // Get value (with optional default)
  get: async (agentId, key, defaultValue = null) => {
    const value = await db.memory.get(agentId, key);
    return value !== null ? value : defaultValue;
  },

  // Set value
  set: async (agentId, key, value) => {
    await db.memory.set(agentId, key, value);
  },

  // Delete key
  delete: async (agentId, key) => {
    if (process.env.DB_MODE === 'sqlite') {
      const Database = (await import('better-sqlite3')).default;
      const dbSqlite = new Database('C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db');
      dbSqlite.prepare('DELETE FROM agent_memory WHERE agent_id=? AND key=?').run(agentId, key);
      dbSqlite.close();
      return;
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('agent_memory').delete().eq('agent_id', agentId).eq('key', key);
    if (error) throw error;
  },

  // Clear all keys for agent
  clear: async (agentId) => {
    if (process.env.DB_MODE === 'sqlite') {
      const Database = (await import('better-sqlite3')).default;
      const dbSqlite = new Database('C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db');
      dbSqlite.prepare('DELETE FROM agent_memory WHERE agent_id=?').run(agentId);
      dbSqlite.close();
      return;
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('agent_memory').delete().eq('agent_id', agentId);
    if (error) throw error;
  },

  // Get all keys for agent
  getAll: async (agentId) => {
    if (process.env.DB_MODE === 'sqlite') {
      const Database = (await import('better-sqlite3')).default;
      const dbSqlite = new Database('C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db');
      const rows = dbSqlite.prepare('SELECT key, value FROM agent_memory WHERE agent_id=?').all(agentId);
      dbSqlite.close();
      const result = {};
      for (const row of rows) {
        result[row.key] = JSON.parse(row.value);
      }
      return result;
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('agent_memory').select('key, value').eq('agent_id', agentId);
    if (error) throw error;
    const result = {};
    for (const row of data) {
      result[row.key] = JSON.parse(row.value);
    }
    return result;
  },

  // Conversation context helpers
  conversation: {
    // Add message to context
    add: async (agentId, chatId, role, content) => {
      const key = `conversation:${chatId}`;
      let ctx = await memory.get(agentId, key, []);
      ctx.push({ role, content, timestamp: Date.now() });
      if (ctx.length > 20) ctx = ctx.slice(-20); // keep last 20
      await memory.set(agentId, key, ctx);
    },
    // Get context for chat
    get: async (agentId, chatId) => {
      return await memory.get(agentId, `conversation:${chatId}`, []);
    },
    // Clear context for chat
    clear: async (agentId, chatId) => {
      await memory.delete(agentId, `conversation:${chatId}`);
    }
  },

  // Flow state helpers (multi-step)
  flow: {
    getState: async (agentId, chatId) => {
      return await memory.get(agentId, `flow:${chatId}:state`, null);
    },
    setState: async (agentId, chatId, state, data = {}) => {
      await memory.set(agentId, `flow:${chatId}:state`, state);
      await memory.set(agentId, `flow:${chatId}:data`, data);
    },
    getData: async (agentId, chatId) => {
      return await memory.get(agentId, `flow:${chatId}:data`, {});
    },
    clear: async (agentId, chatId) => {
      await memory.delete(agentId, `flow:${chatId}:state`);
      await memory.delete(agentId, `flow:${chatId}:data`);
    }
  }
};

export default memory;