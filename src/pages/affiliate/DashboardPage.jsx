import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { MousePointerClick, Ticket, Wallet, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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

export default function DashboardPage() {
  const { affiliate, refreshProfile } = useAuth()
  const [chartData, setChartData] = useState([])
  const [recentConversions, setRecentConversions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!affiliate?.id) return

    async function load() {
      setLoading(true)

      const since = subDays(new Date(), 13).toISOString()

      const [{ data: clicks }, { data: conversions }] = await Promise.all([
        supabase
          .from('clicks')
          .select('clicked_at')
          .eq('affiliate_id', affiliate.id)
          .gte('clicked_at', since),
        supabase
          .from('conversions')
          .select('order_id, ticket_amount, commission_amount, status, converted_at')
          .eq('affiliate_id', affiliate.id)
          .order('converted_at', { ascending: false })
          .limit(8),
      ])

      // Bangun data harian 14 hari terakhir
      const days = Array.from({ length: 14 }, (_, i) => startOfDay(subDays(new Date(), 13 - i)))
      const counts = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const clickCount = (clicks ?? []).filter((c) => c.clicked_at.startsWith(dayStr)).length
        return {
          date: format(day, 'd MMM', { locale: idLocale }),
          klik: clickCount,
        }
      })

      setChartData(counts)
      setRecentConversions(conversions ?? [])
      setLoading(false)
      refreshProfile()
    }

    load()
  }, [affiliate?.id])

  if (!affiliate) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Halo, {affiliate.full_name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Ini ringkasan performamu sebagai mitra Museum Siroh.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MousePointerClick} label="Total Klik" value={affiliate.total_clicks ?? 0} accent="#1B7B5A" />
        <StatCard icon={Ticket} label="Tiket Terjual" value={affiliate.total_conversions ?? 0} accent="#C9A84C" />
        <StatCard icon={Wallet} label="Total Komisi" value={formatRupiah(affiliate.total_commission)} accent="#1B4D3E" />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Konversi"
          value={
            affiliate.total_clicks
              ? `${((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(1)}%`
              : '0%'
          }
          accent="#9C5A3C"
        />
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold">Klik 14 Hari Terakhir</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorKlik" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #1B4D3E1A)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--chart-text, #0F2C2299)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text, #0F2C2299)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #1B4D3E1A', fontSize: 13 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="klik" stroke="#C9A84C" strokeWidth={2} fill="url(#colorKlik)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold">Konversi Terbaru</h2>
        {loading ? (
          <p className="mt-4 text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : recentConversions.length === 0 ? (
          <p className="mt-4 text-sm text-siroh-ink/50 dark:text-white/50">
            Belum ada tiket terjual lewat tautanmu. Yuk mulai sebarkan di halaman Tautan & QR.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-siroh-green/10 dark:border-white/10 text-left text-xs uppercase tracking-wide text-siroh-ink/45 dark:text-white/45">
                  <th className="pb-2 font-medium">Order ID</th>
                  <th className="pb-2 font-medium">Harga Tiket</th>
                  <th className="pb-2 font-medium">Komisi</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentConversions.map((c) => (
                  <tr key={c.order_id} className="border-b border-siroh-green/5 dark:border-white/5">
                    <td className="py-3 font-mono text-xs">{c.order_id}</td>
                    <td className="py-3">{formatRupiah(c.ticket_amount)}</td>
                    <td className="py-3 font-semibold text-siroh-green">{formatRupiah(c.commission_amount)}</td>
                    <td className="py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 text-siroh-ink/55 dark:text-white/55">
                      {format(new Date(c.converted_at), 'd MMM yyyy', { locale: idLocale })}
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
