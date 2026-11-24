import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { join } from 'path';

const PROJECT_ROOT = 'C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP';
const DB_MODE = process.env.DB_MODE || 'sqlite'; // 'sqlite' | 'supabase'

// ===== SQLite (Local) =====
let sqliteDb = null;
function getSqlite() {
  if (!sqliteDb) {
    sqliteDb = new Database(join(PROJECT_ROOT, 'data', 'office.db'));
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }
  return sqliteDb;
}

// ===== Supabase (Cloud) =====
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Supabase credentials not set');
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// ===== Unified API =====
export const db = {
  // --- Agents ---
  agents: {
    list: async (enabledOnly = true) => {
      if (DB_MODE === 'sqlite') {
        const sql = enabledOnly 
          ? 'SELECT * FROM agents WHERE enabled=1 ORDER BY priority' 
          : 'SELECT * FROM agents ORDER BY priority';
        return getSqlite().prepare(sql).all();
      }
      let query = getSupabase().from('agents').select('*').order('priority');
      if (enabledOnly) query = query.eq('enabled', true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      if (DB_MODE === 'sqlite') {
        return getSqlite().prepare('SELECT * FROM agents WHERE id=?').get(id);
      }
      const { data, error } = await getSupabase().from('agents').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    upsert: async (agent) => {
      if (DB_MODE === 'sqlite') {
        const stmt = getSqlite().prepare(`
          INSERT INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, role=excluded.role, emoji=excluded.emoji,
            color=excluded.color, triggers=excluded.triggers, priority=excluded.priority,
            enabled=excluded.enabled, desk=excluded.desk, config=excluded.config,
            updated_at=CURRENT_TIMESTAMP
        `);
        return stmt.run(agent.id, agent.name, agent.role, agent.emoji, agent.color, 
          agent.triggers, agent.priority, agent.enabled, agent.desk, agent.config);
      }
      const { error } = await getSupabase().from('agents').upsert(agent, { onConflict: 'id' });
      if (error) throw error;
    }
  },

  // --- Tasks ---
  tasks: {
    create: async (task) => {
      const id = task.id || crypto.randomUUID();
      const now = new Date().toISOString();
      if (DB_MODE === 'sqlite') {
        getSqlite().prepare(`
          INSERT INTO tasks (id, agent_id, chat_id, sender, push_name, text, message_id, message_type, 
            media_base64, mime_type, is_group, instance, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(id, task.agent_id, task.chat_id, task.sender, task.push_name, task.text,
          task.message_id, task.message_type, task.media_base64, task.mime_type,
          task.is_group ? 1 : 0, task.instance, now);
        return id;
      }
      const { error } = await getSupabase().from('tasks').insert({ id, ...task, status: 'pending', created_at: now });
      if (error) throw error;
      return id;
    },
    get: async (id) => {
      if (DB_MODE === 'sqlite') {
        return getSqlite().prepare('SELECT * FROM tasks WHERE id=?').get(id);
      }
      const { data, error } = await getSupabase().from('tasks').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    updateStatus: async (id, status, result = null, error = null) => {
      const now = new Date().toISOString();
      if (DB_MODE === 'sqlite') {
        getSqlite().prepare(`
          UPDATE tasks SET status=?, result=?, error=?, finished_at=? WHERE id=?
        `).run(status, result ? JSON.stringify(result) : null, error, status === 'done' || status === 'failed' ? now : null, id);
        return;
      }
      const { error: err } = await getSupabase().from('tasks').update({ 
        status, result, error, finished_at: status === 'done' || status === 'failed' ? now : null 
      }).eq('id', id);
      if (err) throw err;
    },
    listPending: async (agentId) => {
      if (DB_MODE === 'sqlite') {
        return getSqlite().prepare('SELECT * FROM tasks WHERE agent_id=? AND status="pending" ORDER BY created_at').all(agentId);
      }
      const { data, error } = await getSupabase().from('tasks')
        .select('*').eq('agent_id', agentId).eq('status', 'pending').order('created_at');
      if (error) throw error;
      return data;
    }
  },

  // --- Events (Dashboard/Realtime) ---
  events: {
    log: async (agentId, event, message, metadata = null) => {
      const now = new Date().toISOString();
      if (DB_MODE === 'sqlite') {
        getSqlite().prepare(`
          INSERT INTO agent_events (agent_id, event, message, metadata, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(agentId, event, message, metadata ? JSON.stringify(metadata) : null, now);
        return;
      }
      const { error } = await getSupabase().from('agent_events').insert({
        agent_id: agentId, event, message, metadata, created_at: now
      });
      if (error) throw error;
    }
  },

  // --- Agent Memory (KV per agent) ---
  memory: {
    get: async (agentId, key) => {
      if (DB_MODE === 'sqlite') {
        const row = getSqlite().prepare('SELECT value FROM agent_memory WHERE agent_id=? AND key=?').get(agentId, key);
        return row ? JSON.parse(row.value) : null;
      }
      const { data, error } = await getSupabase().from('agent_memory')
        .select('value').eq('agent_id', agentId).eq('key', key).single();
      if (error) throw error;
      return data ? JSON.parse(data.value) : null;
    },
    set: async (agentId, key, value) => {
      const now = new Date().toISOString();
      const jsonValue = JSON.stringify(value);
      if (DB_MODE === 'sqlite') {
        getSqlite().prepare(`
          INSERT INTO agent_memory (agent_id, key, value, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(agent_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
        `).run(agentId, key, jsonValue, now);
        return;
      }
      const { error } = await getSupabase().from('agent_memory').upsert({
        agent_id: agentId, key, value: jsonValue, updated_at: now
      }, { onConflict: 'agent_id,key' });
      if (error) throw error;
    }
  },

  // --- WA Allowed Chats ---
  allowedChats: {
    list: async () => {
      if (DB_MODE === 'sqlite') {
        return getSqlite().prepare('SELECT jid FROM wa_allowed_chats').all().map(r => r.jid);
      }
      const { data, error } = await getSupabase().from('wa_allowed_chats').select('jid');
      if (error) throw error;
      return data.map(r => r.jid);
    },
    isAllowed: async (chatId) => {
      const allowed = await db.allowedChats.list();
      return allowed.length === 0 || allowed.includes(chatId);
    }
  },

  // --- Processed Messages (Dedup) ---
  processedMessages: {
    check: async (messageId) => {
      if (DB_MODE === 'sqlite') {
        return !!getSqlite().prepare('SELECT 1 FROM processed_messages WHERE message_id=?').get(messageId);
      }
      const { data, error } = await getSupabase().from('processed_messages').select('message_id').eq('message_id', messageId).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return !!data;
    },
    mark: async (messageId, chatId) => {
      const now = new Date().toISOString();
      if (DB_MODE === 'sqlite') {
        getSqlite().prepare('INSERT OR IGNORE INTO processed_messages (message_id, chat_id, processed_at) VALUES (?, ?, ?)')
          .run(messageId, chatId, now);
        return;
      }
      const { error } = await getSupabase().from('processed_messages').insert({ message_id: messageId, chat_id: chatId, processed_at: now });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation
    }
  }
};

export default db;