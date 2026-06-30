import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { RefreshCw, CheckCircle, AlertCircle, Calendar, Settings, AlertTriangle } from 'lucide-react'

export default function AdminSyncPage() {
  const [apiUrl, setApiUrl] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [configLoading, setConfigLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [syncing, setSyncing] = useState(false)
  const [results, setResults] = useState([])
  const [affiliates, setAffiliates] = useState([])

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['museum_api_url', 'museum_api_secret'])
      if (data) {
        const url = data.find(d => d.key === 'museum_api_url')
        const secret = data.find(d => d.key === 'museum_api_secret')
        if (url) setApiUrl(url.value)
        if (secret) setApiSecret(secret.value)
      }
      setConfigLoading(false)
    }
    loadConfig()

    supabase.from('affiliates').select('id, full_name, ref_code, tier_id').eq('status', 'approved').then(({ data }) => {
      setAffiliates(data ?? [])
    })
  }, [])

  async function handleSync() {
    if (!apiUrl || !apiSecret) { alert('Konfigurasi API belum lengkap. Isi dulu di halaman Konfigurasi API.'); return }
    setSyncing(true)
    setResults([])
    const newResults = []

    for (const aff of affiliates) {
      try {
        const url = `${apiUrl.replace(/\/$/, '')}/api/affiliate?order=${aff.ref_code}&date=${date}`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiSecret}` }
        })
        const json = await res.json()

        if (!res.ok || !json.success) {
          newResults.push({ ref_code: aff.ref_code, name: aff.full_name, status: 'error', message: json?.message ?? 'Gagal' })
          continue
        }

        const d = json.data
        if (!d || d.successfulTransactions === 0) {
          newResults.push({ ref_code: aff.ref_code, name: aff.full_name, status: 'skip', message: 'Tidak ada transaksi' })
          continue
        }

        const { data: tierData } = await supabase.from('tiers').select('commission_rate').eq('id', aff.tier_id).single()
        const rate = tierData?.commission_rate ?? 10
        const commission = (d.totalRevenue * rate) / 100

        const orderId = `${aff.ref_code}-${date}-${d.successfulTransactions}`
        const { error } = await supabase.from('conversions').upsert({
          affiliate_id: aff.id,
          order_id: orderId,
          ticket_amount: d.totalRevenue,
          commission_amount: commission,
          commission_rate: rate,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        }, { onConflict: 'order_id' })

        if (error) {
          newResults.push({ ref_code: aff.ref_code, name: aff.full_name, status: 'error', message: error.message })
        } else {
          newResults.push({
            ref_code: aff.ref_code,
            name: aff.full_name,
            status: 'success',
            message: `${d.totalTicketsSold ?? d.successfulTransactions} tiket | ${d.successfulTransactions} transaksi sukses | Rp ${d.totalRevenue.toLocaleString('id')} | Komisi Rp ${commission.toLocaleString('id')}`
          })
        }
      } catch (err) {
        newResults.push({ ref_code: aff.ref_code, name: aff.full_name, status: 'error', message: err.message })
      }
    }

    setResults(newResults)
    setSyncing(false)
  }

  const configMissing = !configLoading && (!apiUrl || !apiSecret)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Sinkronisasi Konversi</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Tarik data penjualan tiket dari API Museum Siroh (Pull Model).</p>
      </div>

      {configMissing && (
        <div className="card border-siroh-rust/30 bg-siroh-rust/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-siroh-rust" />
            <div className="text-sm text-siroh-ink/70 dark:text-white/70">
              <p className="font-semibold text-siroh-ink dark:text-white">Konfigurasi API belum diisi</p>
              <p className="mt-1">Isi URL domain Vercel museum dan API Secret Key dulu sebelum bisa sync.</p>
              <Link to="/admin/api-keys" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-siroh-rust hover:underline">
                <Settings className="h-3.5 w-3.5" /> Buka Konfigurasi API
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sumber Data</h2>
          <Link to="/admin/api-keys" className="flex items-center gap-1.5 text-xs font-semibold text-siroh-teal hover:underline">
            <Settings className="h-3.5 w-3.5" /> Ubah Konfigurasi
          </Link>
        </div>

        {configLoading ? (
          <p className="text-sm text-siroh-ink/50 dark:text-white/50">Memuat konfigurasi…</p>
        ) : (
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-siroh-ink/10 bg-siroh-ink/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-xs uppercase tracking-wide text-siroh-ink/40 dark:text-white/40">URL Domain Museum</p>
              <p className="mt-1 font-mono text-siroh-ink/80 dark:text-white/80 truncate">{apiUrl || '— belum diisi —'}</p>
            </div>
            <div className="rounded-xl border border-siroh-ink/10 bg-siroh-ink/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-xs uppercase tracking-wide text-siroh-ink/40 dark:text-white/40">API Secret Key</p>
              <p className="mt-1 font-mono text-siroh-ink/80 dark:text-white/80">
                {apiSecret ? `${apiSecret.slice(0, 10)}••••••••` : '— belum diisi —'}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Tanggal</label>
          <div className="relative max-w-xs">
            <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || configMissing || affiliates.length === 0}
          className="btn-gold disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Menyinkronkan…' : `Sync ${affiliates.length} Afiliasi`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Hasil Sinkronisasi</h2>
          <div className="divide-y divide-siroh-ink/10 dark:divide-white/10">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                {r.status === 'success'
                  ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-siroh-green" />
                  : r.status === 'skip'
                  ? <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-siroh-ink/20" />
                  : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-siroh-rust" />
                }
                <div>
                  <p className="text-sm font-medium">{r.name} <span className="font-mono text-xs text-siroh-ink/40 dark:text-white/40">({r.ref_code})</span></p>
                  <p className="text-xs text-siroh-ink/60 dark:text-white/60">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
