import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { KeyRound, Globe, Save, Eye, EyeOff, AlertTriangle, Info } from 'lucide-react'

export default function AdminApiKeys() {
  const [apiUrl, setApiUrl] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [savedSecret, setSavedSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['museum_api_url', 'museum_api_secret'])
      if (data) {
        const url = data.find(d => d.key === 'museum_api_url')
        const secret = data.find(d => d.key === 'museum_api_secret')
        if (url) { setSavedUrl(url.value); setApiUrl(url.value) }
        if (secret) { setSavedSecret(secret.value); setApiSecret(secret.value) }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const upserts = [
      { key: 'museum_api_url', value: apiUrl },
      { key: 'museum_api_secret', value: apiSecret },
    ]

    const { error: err } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' })

    if (err) {
      setError('Gagal menyimpan: ' + err.message)
    } else {
      setSavedUrl(apiUrl)
      setSavedSecret(apiSecret)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Konfigurasi API Museum</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">
          Atur koneksi ke REST API Museum Siroh agar sistem bisa menarik data penjualan tiket secara berkala.
        </p>
      </div>

      <div className="card border-siroh-orange/30 bg-siroh-orange/[0.06] p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-siroh-orange" />
          <div className="text-sm text-siroh-ink/70 dark:text-white/70 space-y-2">
            <p className="font-semibold text-siroh-ink dark:text-white">Cara kerja integrasi (Pull Model)</p>
            <p>
              Sistem ini akan <strong>menarik (pull)</strong> data penjualan dari API Museum Siroh, bukan menerima
              kiriman data. Pastikan Admin Museum sudah mengatur environment variable{' '}
              <code className="rounded bg-siroh-ink/10 px-1 py-0.5 text-xs dark:bg-white/10">AFFILIATE_API_SECRET</code> di Vercel dan
              memberikan Secret Key tersebut ke kamu.
            </p>
            <p className="text-xs text-siroh-ink/55 dark:text-white/55">
              Endpoint yang akan dipanggil: <code className="rounded bg-siroh-ink/10 px-1 py-0.5 dark:bg-white/10">GET [URL]/api/affiliate?order=KODE&date=YYYY-MM-DD</code>
              <br />
              Header: <code className="rounded bg-siroh-ink/10 px-1 py-0.5 dark:bg-white/10">Authorization: Bearer [Secret Key]</code>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
      ) : (
        <form onSubmit={handleSave} className="card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Pengaturan Koneksi</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">
              URL Domain Vercel Museum
              <span className="ml-2 text-xs font-normal text-siroh-ink/40 dark:text-white/40">(landing page / web app museum)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
              <input
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="input-field pl-11"
                placeholder="https://museumsiroh.vercel.app"
              />
            </div>
            {savedUrl && (
              <p className="mt-1.5 text-xs text-siroh-ink/40 dark:text-white/40">Tersimpan: {savedUrl}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">
              API Secret Key
              <span className="ml-2 text-xs font-normal text-siroh-ink/40 dark:text-white/40">(dari ENV AFFILIATE_API_SECRET di Vercel)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                className="input-field pl-11 pr-11"
                placeholder="msm_sr_afli_..."
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-siroh-ink/40 hover:text-siroh-ink dark:text-white/40 dark:hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {savedSecret && (
              <p className="mt-1.5 text-xs text-siroh-ink/40 dark:text-white/40">
                Key tersimpan: <span className="font-mono">{savedSecret.slice(0, 10)}••••••••</span>
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={saving || !apiUrl || !apiSecret} className="btn-gold disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saved ? 'Tersimpan!' : saving ? 'Menyimpan…' : 'Simpan Konfigurasi'}
          </button>
        </form>
      )}
    </div>
  )
}
