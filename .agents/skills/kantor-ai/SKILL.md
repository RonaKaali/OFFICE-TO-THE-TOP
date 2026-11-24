---
name: kantor-ai
description: Bikin dan kelola Kantor AI 3D interaktif dengan multi-agen (Produk, Pesanan, Absensi, Antrian, Keuangan, Konten, Support, Echo) berbasis template kantor-ai, Three.js isometrik, dan sinkronisasi laporan Supabase / laporan.json.
---

# Kantor AI Multi-Agen

Panduan mengelola dan menyesuaikan kantor virtual 3D interaktif tempat seluruh agen AI beraktivitas secara otonom di meja kerja masing-masing.

## 🎯 Fitur Kantor
1. **Multi-Ruangan Mandiri**:
   - Ruang Bizdev & Produk: Manajemen katalog, stok, dan harga UMKM.
   - Ruang Keuangan & Pesanan: Pemrosesan order WhatsApp dan pembukuan kas.
   - Ruang Studio & Konten: Pembuatan caption IG/TikTok dan kampanye marketing.
   - Lounge & Pantry: Sofa istirahat dan coffee machine untuk ngopi santai.
   - Mission Board: Papan tugas interaktif di dinding kantor.
2. **Perilaku Otonom Agen (Autonomous Walking)**:
   - Agen bekerja dan mengetik di mejanya sesuai jam kerja.
   - Saat jeda/santai, agen otomatis berjalan menuju pantry untuk ngopi, melihat Mission Board, atau duduk santai di sofa.
   - Gelembung status melayang menampilkan ringkasan tugas dan status mendesak.
3. **Pilihan Gaya 3D**:
   - `asli` (Warm Wooden Office): Kayu hangat, parket, sofa, dan pencahayaan cozy.
   - `hologram` (Cyberpunk Blueprint): Neon cyan grid, dinding kaca transparan, dan partikel data.
   - `clay` (Plastisin Pastel): Sudut melengkung halus bergaya tanah liat pastel.
   - `diorama` (Miniatur Meja): Miniatur arsitektur aesthetic dengan tilt-shift.

## 📄 Format laporan.json
Agen memperbarui status mereka secara otomatis melalui database Supabase atau file `laporan.json`:
```json
{
  "produk": {
    "ringkasan": "Audit 25 SKU produk dan update harga beras 5kg.",
    "menunggu": ["Konfirmasi stok supplier"],
    "mendesak": [],
    "angka": [{ "label": "SKU Aktif", "nilai": 48 }]
  },
  "pesanan": {
    "ringkasan": "Proses 12 invoice WhatsApp masuk hari ini.",
    "menunggu": [],
    "mendesak": ["Invoice #WA-904 menunggu bukti transfer"],
    "angka": [{ "label": "Order Masuk", "nilai": 12 }]
  }
}
```

---
**Kredit:** Konsep dan inspirasi arsitektur dari *Kantor AI Template* oleh Maliki Saputra (@malikisaputra).
