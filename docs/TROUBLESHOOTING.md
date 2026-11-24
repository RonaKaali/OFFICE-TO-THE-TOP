# TROUBLESHOOTING — OFFICE TO THE TOP

> Common issues & fixes. Update saat nemu error baru.

---

## 🔴 Evolution API Issues

### Evolution API won't start / port 8080 in use
```powershell
# Check what's using port 8080
netstat -ano | findstr :8080
# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in evolution-api/.env
PORT=8081
# Then update EVOLUTION_URL in .env
EVOLUTION_URL=http://localhost:8081
```

### "Database connection failed" (Evolution)
```powershell
# Check SQLite file exists
ls data/evolution.db

# Delete & let it recreate
del data/evolution.db
# Restart Evolution API
```

### QR Code not showing / expired
```powershell
# 1. Logout instance
curl -X DELETE http://localhost:8080/instance/logout/kantor-ai -H "apikey: YOUR_KEY"

# 2. Restart Evolution API
# 3. Open manager again
start http://localhost:8080/manager

# 4. Scan with FRESH WhatsApp (not WhatsApp Web)
```

### "Instance not connected" after restart
```powershell
# Evolution API doesn't persist session by default
# Fix: Set in evolution-api/.env
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true

# Or use supabase for Evolution (more complex)
```

### Webhook not receiving messages
```powershell
# 1. Check webhook URL set correctly
curl -X POST http://localhost:8080/webhook/set/kantor-ai \
  -H "apikey: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3001/webhook/wa-incoming","events":["messages.upsert"]}'

# 2. Verify webhook server running
curl http://localhost:3001/webhook/wa-incoming

# 3. Check Evolution logs for webhook delivery
# 4. If using Cloudflare Tunnel: verify tunnel URL is HTTPS
```

---

## 🟡 Webhook Server Issues

### "Address already in use" port 3001
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
# Or change WEBHOOK_PORT in .env
WEBHOOK_PORT=3002
```

### Messages duplicated
```powershell
# Check processed_messages table
sqlite3 data/office.db "SELECT * FROM processed_messages ORDER BY processed_at DESC LIMIT 10;"

# Clear if stuck
sqlite3 data/office.db "DELETE FROM processed_messages;"
```

### ACL blocking messages (WA_ALLOWED_CHATS)
```powershell
# Check current allowed chats
sqlite3 data/office.db "SELECT * FROM wa_allowed_chats;"

# Add chat JID (get from Evolution logs)
sqlite3 data/office.db "INSERT INTO wa_allowed_chats (jid, description) VALUES ('628123456789@s.whatsapp.net', 'Alex personal');"

# Or set in .env (comma-separated)
WA_ALLOWED_CHATS=628123456789@s.whatsapp.net,120363012345678901@g.us
```

---

## 🟢 Agent Issues

### Agent not responding / "Agent not found"
```powershell
# 1. Check agent registered & enabled
sqlite3 data/office.db "SELECT id, name, enabled FROM agents;"

# 2. Enable if disabled
sqlite3 data/office.db "UPDATE agents SET enabled=1 WHERE id='produk';"

# 3. Check skill installed in Hermes
ls "C:\Users\LENOVO\AppData\Local\hermes\profiles\default\skills\agent-produk"

# 4. Restart Hermes Agent (reload skills)
```

### Agent stuck in "Working" status
```powershell
# Housekeeping should auto-fix (15 min timeout)
# Manual fix:
sqlite3 data/office.db "UPDATE agents SET status='idle' WHERE id='produk';"
# Or via status skill
node -e "import('./skills/lib-status/status.js').then(m => m.status.setStatus('produk', 'idle', 'Manual reset'))"
```

### Agent error: "Skill not found"
```powershell
# Skill folder name must match agent_id exactly
# agent-produk folder → agent_id: 'produk'
# Check: skills/agent-produk/agent.js exports handleMessage
```

### Database locked (SQLite)
```powershell
# Only one process can write at a time
# Kill other node processes
taskkill /IM node.exe /F

# Or enable WAL mode (already in init-db.js)
# PRAGMA journal_mode=WAL;
```

---

## 🔵 Supabase Issues

### "Invalid API key" / "JWT expired"
```powershell
# Check .env keys are correct (no extra spaces/quotes)
# Use NEW keys: sb_publishable_... and sb_secret_...
# Old anon/service_role deprecated late 2026

# Test connection
curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/agents
```

### RLS blocking reads
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'agents';

-- Ensure anon key can SELECT agents (for dashboard)
CREATE POLICY "anon_read_agents" ON agents
  FOR SELECT USING (true);
```

### Realtime not working
```powershell
# Check Supabase dashboard → Replication → enabled for tables
# Dashboard needs anon key with SELECT on agent_events
```

---

## 🟣 Cloudflare Tunnel Issues

### Tunnel URL changes every restart
```powershell
# Free tier: URL rotates. For fixed URL:
# 1. Create Cloudflare account
# 2. cloudflared tunnel login
# 3. cloudflared tunnel create office-to-the-top
# 4. cloudflared tunnel route dns office-to-the-top wa.yourdomain.com
# 5. Run: cloudflared tunnel run office-to-the-top
```

### "Connection refused" from Evolution to tunnel
```powershell
# Tunnel forwards to localhost:8080
# Ensure Evolution API running on :8080
# Check tunnel logs for errors
```

---

## 🟠 Windows Auto-Start Issues

### Task Scheduler not running
```powershell
# Check task exists
Get-ScheduledTask -TaskName "OfficeToTheTop-AutoStart"

# Check history (enable in Task Scheduler → Action → Enable All Tasks History)
# Run manually to test
Run-ScheduledTask -TaskName "OfficeToTheTop-AutoStart"

# Common: "Run with highest privileges" not checked
# Fix: Edit task → General → Check "Run with highest privileges"
```

### Docker not starting (if using Docker)
```powershell
# Ensure Docker Desktop starts on boot
# Settings → General → "Start Docker Desktop when you log in"
```

---

## ⚪ General Debugging

### Enable debug logging
```powershell
# In .env
LOG_LEVEL=DEBUG
# Or set in PowerShell before running
$env:LOG_LEVEL = "DEBUG"
npm run start
```

### Check all processes
```powershell
# Evolution API
Get-Process node | Where-Object { $_.Path -like "*evolution*" }

# Webhook server
Get-Process node | Where-Object { $_.Path -like "*webhook*" }

# Hermes Agent
Get-Process hermes*
```

### Reset everything (nuclear option)
```powershell
# Stop all
npm run stop
taskkill /IM node.exe /F
taskkill /IM hermes* /F

# Delete databases
del data\office.db
del data\evolution.db

# Re-run setup
npm run setup
npm run db:init
npm run db:seed
npm run start
```

---

## 📞 Escalation

| Issue | Contact | Info to Provide |
|-------|---------|-----------------|
| Evolution API bug | Evolution GitHub Issues | Version, logs, steps to reproduce |
| Hermes Agent bug | Hermes Discord/Repo | Profile, skill, error stack |
| Supabase issue | Supabase Support | Project ref, error, query |
| Our code bug | Alex (Telegram) | Error log, steps, expected vs actual |

---

## 📝 Log Locations

| Component | Location |
|-----------|----------|
| Evolution API | Terminal running `npm run start` (in evolution-api/) |
| Webhook Server | Terminal running `node index.js` |
| Hermes Agent | Hermes Desktop App → Kanban Board "Office Agents" |
| SQLite | `data/office.db` (use DB Browser for SQLite) |
| Windows Events | Event Viewer → Windows Logs → Application |
| Task Scheduler | Task Scheduler → History tab (enable first) |