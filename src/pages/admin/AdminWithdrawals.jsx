import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Check, X, CircleDollarSign } from 'lucide-react'

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}

const STATUS_FILTERS = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'paid', label: 'Sudah Dibayar' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all', label: 'Semua' },
]

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('withdrawals')
      .select('*, affiliates(full_name, email)')
      .order('requested_at', { ascending: false })
    setWithdrawals(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    setBusyId(id)
    await supabase
      .from('withdrawals')
      .update({ status, processed_at: new Date().toISOString() })
      .eq('id', id)
    await load()
    setBusyId(null)
  }

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Pengajuan Penarikan</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Tinjau dan proses permintaan pencairan komisi mitra.</p>
      </div>

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

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-siroh-ink/50 dark:text-white/50">Tidak ada pengajuan untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siroh-ink/10 bg-siroh-ink/[0.02] text-left text-xs uppercase tracking-wide text-siroh-ink/45 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45">
                  <th className="px-6 py-3 font-medium">Mitra</th>
                  <th className="px-6 py-3 font-medium">Jumlah</th>
                  <th className="px-6 py-3 font-medium">Rekening Tujuan</th>
                  <th className="px-6 py-3 font-medium">Diajukan</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-b border-siroh-ink/5 dark:border-white/5">
                    <td className="px-6 py-3">
                      <p className="font-medium">{w.affiliates?.full_name}</p>
                      <p className="text-xs text-siroh-ink/50 dark:text-white/50">{w.affiliates?.email}</p>
                    </td>
                    <td className="px-6 py-3 font-semibold text-siroh-teal">{formatRupiah(w.amount)}</td>
                    <td className="px-6 py-3 text-siroh-ink/70 dark:text-white/70">
                      <p>{w.bank_name} — {w.bank_account_no}</p>
                      <p className="text-xs text-siroh-ink/50 dark:text-white/50">{w.bank_account_name}</p>
                    </td>
                    <td className="px-6 py-3 text-siroh-ink/55 dark:text-white/55">
                      {format(new Date(w.requested_at), 'd MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(w.id, 'approved')}
                              disabled={busyId === w.id}
                              className="flex items-center gap-1 rounded-lg bg-siroh-emerald/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-emerald hover:bg-siroh-emerald/25 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Setujui
                            </button>
                            <button
                              onClick={() => updateStatus(w.id, 'rejected')}
                              disabled={busyId === w.id}
                              className="flex items-center gap-1 rounded-lg bg-siroh-rust/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-rust hover:bg-siroh-rust/25 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <button
                            onClick={() => updateStatus(w.id, 'paid')}
                            disabled={busyId === w.id}
                            className="flex items-center gap-1 rounded-lg bg-siroh-teal/15 px-2.5 py-1.5 text-xs font-semibold text-siroh-teal hover:bg-siroh-teal/25 disabled:opacity-50"
                          >
                            <CircleDollarSign className="h-3.5 w-3.5" /> Tandai Dibayar
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
    pending: 'bg-siroh-orange/15 text-siroh-orange',
    approved: 'bg-siroh-emerald/15 text-siroh-emerald',
    paid: 'bg-siroh-teal/15 text-siroh-teal',
    rejected: 'bg-siroh-rust/15 text-siroh-rust',
  }
  const labels = { pending: 'Menunggu', approved: 'Disetujui', paid: 'Sudah Dibayar', rejected: 'Ditolak' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
