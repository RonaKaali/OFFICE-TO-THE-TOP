---
name: agent-absensi
description: "Agen Absensi: Cek laporan absensi selfie. Trigger: absen, hadir, laporan. Perintah: /absensi ..."
category: office-agents
---
# agent-absensi — Attendance Agent

## Trigger
- Command: `/absensi <subcommand>`
- Triggers: `["absen", "hadir", "laporan"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/absensi hadir` | Absen masuk (selfie + lokasi) |
| `/absensi pulang` | Absen pulang |
| `/absensi laporan` | Laporan bulanan saya |
| `/absensi izin` | Ajukan izin/cuti |

## Integration
- SaaS Absensi Selfie existing
- Face verification via Playwright/ML
- GPS location check
- Export Excel/PDF untuk HR