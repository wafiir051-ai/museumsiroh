import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Search, Check, Ban, RotateCcw } from 'lucide-react'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'suspended', label: 'Dinonaktifkan' },
]

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('affiliates')
      .select('*, tiers(name, badge_color)')
      .order('created_at', { ascending: false })
    setAffiliates(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    setBusyId(id)
    await supabase
      .from('affiliates')
      .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null })
      .eq('id', id)
    await load()
    setBusyId(null)
  }

  const filtered = affiliates.filter((a) => {
    const matchesFilter = filter === 'all' || a.status === filter
    const matchesSearch =
      !search ||
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.ref_code?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Kelola Mitra</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Setujui pendaftar baru atau kelola mitra yang sudah aktif.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-siroh-teal text-siroh-charcoal' : 'bg-siroh-ink/5 text-siroh-ink/70 dark:bg-white/10 dark:text-white/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, kode…"
            className="input-field w-64 py-2 pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Tidak ada mitra untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siroh-ink/10 bg-siroh-ink/[0.02] text-left text-xs uppercase tracking-wide text-siroh-ink/45 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45">
                  <th className="px-6 py-3 font-medium">Nama</th>
                  <th className="px-6 py-3 font-medium">Kontak</th>
                  <th className="px-6 py-3 font-medium">Kode</th>
                  <th className="px-6 py-3 font-medium">Tier</th>
                  <th className="px-6 py-3 font-medium">Tiket</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Daftar</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-siroh-ink/5 dark:border-white/5">
                    <td className="px-6 py-3 font-medium">{a.full_name}</td>
                    <td className="px-6 py-3 text-siroh-ink/60 dark:text-white/60">
                      <p>{a.email}</p>
                      <p className="text-xs">{a.phone}</p>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">{a.ref_code}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-semibold" style={{ color: a.tiers?.badge_color }}>
                        {a.tiers?.name}
                      </span>
                    </td>
                    <td className="px-6 py-3">{a.total_conversions}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-6 py-3 text-siroh-ink/55 dark:text-white/55">
                      {format(new Date(a.created_at), 'd MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        {a.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(a.id, 'approved')}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1 rounded-lg bg-siroh-emerald/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-emerald hover:bg-siroh-emerald/25 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Setujui
                          </button>
                        )}
                        {a.status === 'approved' && (
                          <button
                            onClick={() => updateStatus(a.id, 'suspended')}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1 rounded-lg bg-siroh-rust/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-rust hover:bg-siroh-rust/25 disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" /> Nonaktifkan
                          </button>
                        )}
                        {a.status === 'suspended' && (
                          <button
                            onClick={() => updateStatus(a.id, 'approved')}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1 rounded-lg bg-siroh-emerald/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-emerald hover:bg-siroh-emerald/25 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Aktifkan
                          </button>
                        )}
                      </div>
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
    approved: 'bg-siroh-emerald/15 text-siroh-emerald',
    pending: 'bg-siroh-gold/15 text-siroh-gold',
    suspended: 'bg-siroh-rust/15 text-siroh-rust',
  }
  const labels = { approved: 'Disetujui', pending: 'Menunggu', suspended: 'Dinonaktifkan' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
