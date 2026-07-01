import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Siroh Partner] Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper untuk panggil edge function track-click (dipanggil dari halaman redirect publik)
export async function trackClick(refCode, source = 'direct') {
  try {
    await fetch(`${supabaseUrl}/functions/v1/swift-endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_code: refCode, source }),
    })
  } catch (err) {
    // Gagal tracking tidak boleh menghalangi redirect ke museumsiroh.online
    console.error('Gagal mencatat klik:', err)
  }
}
