---
name: agent-konten
description: "Agen Konten: Generate caption/ide IG/TikTok. Trigger: caption, ide konten, post. Perintah: /konten ..."
category: office-agents
---
# agent-konten — Content Generation Agent

## Trigger
- Command: `/konten <subcommand>`
- Triggers: `["caption", "ide konten", "post"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/konten caption "Produk" "Promo 50%"` | Generate caption IG |
| `/konten ide "Kuliner" 5` | Ide konten 5 buah |
| `/konten hashtag "Kuliner"` | Rekomendasi hashtag |
| `/konten jadwal` | Jadwal posting mingguan |
| `/konten rewrite "Caption lama"` | Rewrite caption |

## Integration
- LLM (Gemini/Claude) untuk generate
- Template per niche (kuliner, fashion, dll)
- Brand voice WEBSITE GENZ
- Auto-schedule via Meta API (future)