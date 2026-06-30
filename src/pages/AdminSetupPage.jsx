import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ScrollText, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

export default function AdminSetupPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function check() {
      const { count } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
      if (count > 0) navigate('/admin/login', { replace: true })
      else setChecking(false)
    }
    check()
  }, [navigate])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Kata sandi minimal 6 karakter.'); return }
    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (signUpError) { setLoading(false); setError(signUpError.message); return }

    const userId = signUpData.user?.id
    if (!userId) { setLoading(false); setError('Gagal mendapatkan user ID.'); return }

    const { error: insertError } = await supabase
      .from('admins')
      .insert({ user_id: userId, full_name: form.fullName })
    if (insertError) { setLoading(false); setError('Gagal insert admin: ' + insertError.message); return }

    setLoading(false)
    navigate('/admin/login')
  }

  if (checking) return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-siroh-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper lattice-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <ScrollText className="h-6 w-6 text-siroh-gold" />
          <span className="font-display text-lg font-semibold">Siroh Admin Setup</span>
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold">Buat Admin Pertama</h1>
          <p className="mt-1 text-sm text-siroh-ink/60">Halaman ini hanya muncul sekali sebelum ada admin.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40" />
                <input required value={form.fullName} onChange={set('fullName')} className="input-field pl-11" placeholder="Nama admin" />
              </div>
            </div>
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
                <input type="password" required value={form.password} onChange={set('password')} className="input-field pl-11" placeholder="Minimal 6 karakter" />
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? 'Memproses…' : 'Buat Admin & Masuk'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
