import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Search } from 'lucide-react'

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}

export default function AdminTransactions() {
  const [conversions, setConversions] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('conversions')
      .select('*, affiliates(full_name, ref_code)')
      .order('converted_at', { ascending: false })
      .then(({ data }) => {
        setConversions(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = conversions.filter(
    (c) =>
      !search ||
      c.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.affiliates?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.affiliates?.ref_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Semua Transaksi</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">
          Daftar tiket yang terjual lewat tautan mitra, dilaporkan otomatis via API.
        </p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari order ID, mitra, kode…"
          className="input-field py-2 pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siroh-ink/10 bg-siroh-ink/[0.02] text-left text-xs uppercase tracking-wide text-siroh-ink/45 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45">
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Mitra</th>
                  <th className="px-6 py-3 font-medium">Harga Tiket</th>
                  <th className="px-6 py-3 font-medium">Komisi</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-siroh-ink/5 dark:border-white/5">
                    <td className="px-6 py-3 font-mono text-xs">{c.order_id}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium">{c.affiliates?.full_name}</p>
                      <p className="font-mono text-xs text-siroh-ink/50 dark:text-white/50">{c.affiliates?.ref_code}</p>
                    </td>
                    <td className="px-6 py-3">{formatRupiah(c.ticket_amount)}</td>
                    <td className="px-6 py-3 font-semibold text-siroh-teal">{formatRupiah(c.commission_amount)}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-3 text-siroh-ink/55 dark:text-white/55">
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
    pending: 'bg-siroh-orange/15 text-siroh-orange',
    cancelled: 'bg-siroh-rust/15 text-siroh-rust',
  }
  const labels = { confirmed: 'Terkonfirmasi', pending: 'Menunggu', cancelled: 'Dibatalkan' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
