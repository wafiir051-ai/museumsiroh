# Siroh Partner

Portal afiliasi resmi untuk memasarkan tiket Museum Siroh (museumsiroh.online).

## 🚀 Setup Cepat

### 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**, jalankan seluruh isi file `supabase/schema.sql`
3. Buka **Project Settings → API**, catat:
   - `Project URL`
   - `anon public key`
4. Deploy 3 edge functions (butuh [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase link --project-ref <project-ref>
   supabase functions deploy report-conversion
   supabase functions deploy track-click
   supabase functions deploy generate-api-key
   ```
5. Daftarkan admin pertama:
   - Daftar akun lewat halaman `/register` seperti biasa
   - Di Supabase SQL Editor, jalankan:
     ```sql
     insert into public.admins (user_id, full_name)
     values ('<user_id_dari_auth.users>', 'Nama Admin');
     ```

### 2. Setup Project Lokal

```bash
cp .env.example .env
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

### 3. Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Tambahkan environment variables yang sama (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_MUSEUM_TICKET_URL`) di Vercel dashboard → Settings → Environment Variables.

Domain default: `siroh-partner.vercel.app`. Custom domain bisa ditambahkan kapan saja lewat Vercel dashboard.

---

## 🔗 Integrasi dengan museumsiroh.online

### Langkah 1 — Generate API Key
Masuk sebagai admin → menu **API Keys** → klik **Buat API Key**. Simpan key yang muncul (hanya tampil sekali).

### Langkah 2 — Tracking Klik
Saat orang klik tautan referral (`https://siroh-partner.vercel.app/go/AB12CD`), sistem otomatis:
1. Mencatat klik ke tabel `clicks`
2. Redirect ke `museumsiroh.online?ref=AB12CD`

Pastikan museumsiroh.online membaca query param `?ref=` dan menyimpannya (misal di session/cookie) sampai checkout selesai.

### Langkah 3 — Lapor Konversi
Setelah pembayaran tiket berhasil, museumsiroh.online (server-side) memanggil:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/report-conversion \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_live_xxxxxxxxxxxxxxxx" \
  -d '{
    "ref_code": "AB12CD",
    "order_id": "ORDER-2026-00123",
    "ticket_amount": 150000
  }'
```

Response sukses:
```json
{ "success": true, "commission_amount": 19500, "commission_rate": 13 }
```

Sistem otomatis akan:
- Menghitung komisi sesuai tier affiliate saat ini
- Mencatat ke `conversions`
- Update total komisi & jumlah konversi affiliate
- Menaikkan tier affiliate otomatis jika syarat terpenuhi

---

## 📁 Struktur Project

```
siroh-partner/
├── supabase/
│   ├── schema.sql                       # Skema database lengkap + RLS
│   └── functions/
│       ├── report-conversion/           # Endpoint lapor konversi (dipanggil museumsiroh.online)
│       ├── track-click/                 # Endpoint catat klik referral
│       └── generate-api-key/            # Endpoint admin generate API key
└── src/
    ├── lib/supabase.js                  # Client Supabase + helper trackClick
    ├── context/AuthContext.jsx          # State login, profil affiliate, status admin
    ├── App.jsx                          # Routing + route guards
    ├── pages/
    │   ├── LandingPage.jsx              # Halaman publik utama
    │   ├── LoginPage.jsx / RegisterPage.jsx
    │   ├── PendingApprovalPage.jsx      # Untuk affiliate belum disetujui
    │   ├── GoPage.jsx                   # /go/:refCode — tracking + redirect
    │   ├── affiliate/                   # Dashboard, Links, Komisi, Penarikan, Toolbox
    │   └── admin/                       # Dashboard, Affiliates, Transactions, Withdrawals, ApiKeys
    └── layouts/
        ├── AffiliateLayout.jsx
        └── AdminLayout.jsx
```

## 🎨 Tema Desain

Warna heritage Islami modern:
- `siroh-green` `#1B4D3E` — hijau utama
- `siroh-gold` `#C9A84C` — emas/CTA
- `siroh-paper` `#FAF7EF` — krem hangat (pengganti putih polos)
- `siroh-rust` `#9C5A3C` — aksen error/sekunder

Font: **Fraunces** (display/heading) + **Inter** (body).

## 🏆 Sistem Tier

| Tier | Min. Tiket Terjual | Komisi |
|------|---------------------|--------|
| Bronze | 0 | 10% |
| Silver | 10 | 13% |
| Gold | 30 | 16% |
| Platinum | 75 | 20% |

Tier naik otomatis lewat trigger database saat konversi dikonfirmasi.
