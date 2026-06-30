import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Banknote, AlertCircle, CheckCircle2 } from 'lucide-react'

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}

const MIN_WITHDRAW = 100000

export default function WithdrawPage() {
  const { affiliate, refreshProfile } = useAuth()
  const [withdrawals, setWithdrawals] = useState([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [form, setForm] = useState({ amount: '', bankName: '', accountNo: '', accountName: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadWithdrawals() {
    if (!affiliate?.id) return
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('requested_at', { ascending: false })
    setWithdrawals(data ?? [])
    setPendingTotal((data ?? []).filter((w) => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0))
  }

  useEffect(() => {
    loadWithdrawals()
    if (affiliate) {
      setForm((f) => ({
        ...f,
        bankName: affiliate.bank_name ?? '',
        accountNo: affiliate.bank_account_no ?? '',
        accountName: affiliate.bank_account_name ?? '',
      }))
    }
  }, [affiliate?.id])

  const availableBalance = (affiliate?.total_commission ?? 0) - pendingTotal -
    withdrawals.filter((w) => w.status === 'paid' || w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const amount = Number(form.amount)

    if (!amount || amount < MIN_WITHDRAW) {
      setError(`Minimal penarikan ${formatRupiah(MIN_WITHDRAW)}.`)
      return
    }
    if (amount > availableBalance) {
      setError('Jumlah penarikan melebihi saldo yang tersedia.')
      return
    }
    if (!form.bankName || !form.accountNo || !form.accountName) {
      setError('Lengkapi data bank terlebih dahulu.')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('withdrawals').insert({
      affiliate_id: affiliate.id,
      amount,
      bank_name: form.bankName,
      bank_account_no: form.accountNo,
      bank_account_name: form.accountName,
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    // Simpan data bank ke profil supaya tidak perlu diketik ulang
    await supabase
      .from('affiliates')
      .update({ bank_name: form.bankName, bank_account_no: form.accountNo, bank_account_name: form.accountName })
      .eq('id', affiliate.id)

    setSuccess('Pengajuan penarikan berhasil dikirim. Tim kami akan memprosesnya segera.')
    setForm((f) => ({ ...f, amount: '' }))
    refreshProfile()
    loadWithdrawals()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Penarikan Komisi</h1>
        <p className="mt-1 text-sm text-siroh-ink/60">Ajukan penarikan komisi ke rekening bankmu.</p>
      </div>

      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-siroh-gold/15">
          <Banknote className="h-5 w-5 text-siroh-gold" />
        </div>
        <div>
          <p className="text-xs text-siroh-ink/55">Saldo Tersedia untuk Ditarik</p>
          <p className="font-display text-2xl font-semibold text-siroh-green">{formatRupiah(availableBalance)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Ajukan Penarikan</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Jumlah Penarikan</label>
              <input
                type="number"
                min={MIN_WITHDRAW}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="input-field"
                placeholder={`Min. ${formatRupiah(MIN_WITHDRAW)}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Nama Bank</label>
              <input
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                className="input-field"
                placeholder="BCA, Mandiri, BSI, dll"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Nomor Rekening</label>
              <input
                value={form.accountNo}
                onChange={(e) => setForm((f) => ({ ...f, accountNo: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Nama Pemilik Rekening</label>
              <input
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                className="input-field"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-xl bg-siroh-emerald/10 p-3 text-sm text-siroh-emerald">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-gold w-full disabled:opacity-60">
              {submitting ? 'Mengirim…' : 'Ajukan Penarikan'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Riwayat Penarikan</h2>
          {withdrawals.length === 0 ? (
            <p className="mt-4 text-sm text-siroh-ink/50">Belum ada riwayat penarikan.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl border border-siroh-green/10 p-3">
                  <div>
                    <p className="font-semibold">{formatRupiah(w.amount)}</p>
                    <p className="text-xs text-siroh-ink/50">
                      {format(new Date(w.requested_at), 'd MMM yyyy', { locale: idLocale })} • {w.bank_name}
                    </p>
                  </div>
                  <WithdrawStatusBadge status={w.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WithdrawStatusBadge({ status }) {
  const styles = {
    pending: 'bg-siroh-gold/15 text-siroh-gold',
    approved: 'bg-siroh-emerald/15 text-siroh-emerald',
    paid: 'bg-siroh-green/15 text-siroh-green',
    rejected: 'bg-siroh-rust/15 text-siroh-rust',
  }
  const labels = { pending: 'Menunggu', approved: 'Disetujui', paid: 'Sudah Dibayar', rejected: 'Ditolak' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
