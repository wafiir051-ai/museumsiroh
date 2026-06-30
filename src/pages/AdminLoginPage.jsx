import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ScrollText, Mail, Lock, KeyRound, ArrowRight, AlertCircle } from 'lucide-react'

const ADMIN_ACCESS_CODE = 'siroh-admin-museum'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.code !== ADMIN_ACCESS_CODE) {
      setError('Kode akses salah.')
      return
    }

    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (signInError) {
      setLoading(false)
      setError('Email atau kata sandi salah.')
      return
    }

    const { data: adminRow } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (!adminRow) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Akun ini tidak memiliki akses admin.')
      return
    }

    setLoading(false)
    navigate('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper lattice-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <ScrollText className="h-6 w-6 text-siroh-gold" />
          <span className="font-display text-lg font-semibold">Siroh Admin</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold">Masuk sebagai Admin</h1>
          <p className="mt-1 text-sm text-siroh-ink/60">Halaman khusus pengelola program afiliasi.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40" />
                <input type="email" required value={form.email} onChange={set('email')} className="input-field pl-11" placeholder="admin@email.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40" />
                <input type="password" required value={form.password} onChange={set('password')} className="input-field pl-11" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Kode Akses</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40" />
                <input type="password" required value={form.code} onChange={set('code')} className="input-field pl-11" placeholder="Kode khusus admin" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? 'Memverifikasi…' : 'Masuk'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
