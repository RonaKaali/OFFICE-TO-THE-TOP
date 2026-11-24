---
name: agent-antrian
description: "Agen Antrian: Kelola antrian digital. Trigger: antrian, nomor, panggil. Perintah: /antrian ..."
category: office-agents
---
# agent-antrian — Digital Queue Agent

## Trigger
- Command: `/antrian <subcommand>`
- Triggers: `["antrian", "nomor", "panggil"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/antrian ambil` | Ambil nomor antrian |
| `/antrian status` | Cek posisi antrian |
| `/antrian panggil` | Panggil berikutnya (admin) |
| `/antrian reset` | Reset antrian (admin) |
| `/antrian daftar` | Lihat daftar antrian |

## Integration
- SaaS Antrian Digital existing
- Display di TV/Monitor via web
- Sound notification
- Multi-lokasi support