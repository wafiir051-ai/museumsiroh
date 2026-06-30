import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Ticket, Wallet, Clock } from 'lucide-react'

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '1A' }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs text-siroh-ink/55 dark:text-white/55">{label}</p>
        <p className="font-display text-xl font-semibold">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    pendingAffiliates: 0,
    totalConversions: 0,
    totalCommission: 0,
    pendingWithdrawals: 0,
  })
  const [topAffiliates, setTopAffiliates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: affiliates }, { data: conversions }, { data: withdrawals }] = await Promise.all([
        supabase.from('affiliates').select('id, status, full_name, total_conversions, total_commission, tiers(name, badge_color)'),
        supabase.from('conversions').select('commission_amount, status'),
        supabase.from('withdrawals').select('amount, status'),
      ])

      const totalAffiliates = affiliates?.length ?? 0
      const pendingAffiliates = (affiliates ?? []).filter((a) => a.status === 'pending').length
      const confirmedConversions = (conversions ?? []).filter((c) => c.status === 'confirmed')
      const totalCommission = confirmedConversions.reduce((s, c) => s + Number(c.commission_amount), 0)
      const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'pending').length

      const top = [...(affiliates ?? [])]
        .filter((a) => a.status === 'approved')
        .sort((a, b) => b.total_conversions - a.total_conversions)
        .slice(0, 5)

      setStats({
        totalAffiliates,
        pendingAffiliates,
        totalConversions: confirmedConversions.length,
        totalCommission,
        pendingWithdrawals,
      })
      setTopAffiliates(top)
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Ringkasan Platform</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Performa program afiliasi Museum Siroh secara keseluruhan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Mitra" value={stats.totalAffiliates} accent="#1B4D3E" />
        <StatCard icon={Clock} label="Menunggu Persetujuan" value={stats.pendingAffiliates} accent="#C9A84C" />
        <StatCard icon={Ticket} label="Tiket Terjual" value={stats.totalConversions} accent="#1B7B5A" />
        <StatCard icon={Wallet} label="Total Komisi Dibayar" value={formatRupiah(stats.totalCommission)} accent="#9C5A3C" />
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold">Mitra Teraktif</h2>
        {loading ? (
          <p className="mt-4 text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : topAffiliates.length === 0 ? (
          <p className="mt-4 text-sm text-siroh-ink/50 dark:text-white/50">Belum ada data mitra.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {topAffiliates.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-siroh-ink/10 p-3 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold text-siroh-orange/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium">{a.full_name}</p>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: a.tiers?.badge_color }}
                    >
                      {a.tiers?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{a.total_conversions} tiket</p>
                  <p className="text-xs text-siroh-ink/50 dark:text-white/50">{formatRupiah(a.total_commission)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
