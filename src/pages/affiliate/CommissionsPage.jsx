import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Wallet } from 'lucide-react'

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'confirmed', label: 'Terkonfirmasi' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

export default function CommissionsPage() {
  const { affiliate } = useAuth()
  const [conversions, setConversions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!affiliate?.id) return
    supabase
      .from('conversions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('converted_at', { ascending: false })
      .then(({ data }) => {
        setConversions(data ?? [])
        setLoading(false)
      })
  }, [affiliate?.id])

  const filtered = filter === 'all' ? conversions : conversions.filter((c) => c.status === filter)
  const totalConfirmed = conversions
    .filter((c) => c.status === 'confirmed')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Riwayat Komisi</h1>
        <p className="mt-1 text-sm text-siroh-ink/60">Semua transaksi tiket yang masuk lewat tautanmu.</p>
      </div>

      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-siroh-green/10">
          <Wallet className="h-5 w-5 text-siroh-green" />
        </div>
        <div>
          <p className="text-xs text-siroh-ink/55">Total Komisi Terkonfirmasi</p>
          <p className="font-display text-2xl font-semibold text-siroh-green">{formatRupiah(totalConfirmed)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-siroh-green text-siroh-paper' : 'bg-siroh-green/10 text-siroh-ink/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-siroh-ink/50">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-siroh-ink/50">Belum ada data untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siroh-green/10 bg-siroh-green/[0.03] text-left text-xs uppercase tracking-wide text-siroh-ink/45">
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Harga Tiket</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                  <th className="px-6 py-3 font-medium">Komisi</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-siroh-green/5">
                    <td className="px-6 py-3 font-mono text-xs">{c.order_id}</td>
                    <td className="px-6 py-3">{formatRupiah(c.ticket_amount)}</td>
                    <td className="px-6 py-3">{c.commission_rate}%</td>
                    <td className="px-6 py-3 font-semibold text-siroh-green">{formatRupiah(c.commission_amount)}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-3 text-siroh-ink/55">
                      {format(new Date(c.converted_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-siroh-emerald/15 text-siroh-emerald',
    pending: 'bg-siroh-gold/15 text-siroh-gold',
    cancelled: 'bg-siroh-rust/15 text-siroh-rust',
  }
  const labels = { confirmed: 'Terkonfirmasi', pending: 'Menunggu', cancelled: 'Dibatalkan' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
