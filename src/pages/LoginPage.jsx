import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) alert(error.message)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email atau kata sandi salah.'
          : signInError.message
      )
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper lattice-bg px-6 dark:bg-siroh-charcoal">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <Logo className="h-9" showText />
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold">Masuk ke akunmu</h1>
          <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Kelola tautan dan komisimu di sini.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? 'Memproses…' : 'Masuk'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-siroh-ink/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-siroh-ink/40 dark:text-white/40">
              <span className="bg-white px-2 dark:bg-siroh-charcoal2">atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-siroh-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-siroh-ink hover:bg-gray-50 transition dark:border-white/15 dark:bg-siroh-charcoal3 dark:text-white dark:hover:bg-white/5"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Masuk dengan Google
          </button>

          <p className="mt-6 text-center text-sm text-siroh-ink/60 dark:text-white/60">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-siroh-teal hover:underline">
              Daftar sebagai mitra
            </Link>
          </p>
        </div>
        <Link to="/admin/login" className="mt-4 block text-center text-xs text-siroh-ink/30 hover:text-siroh-ink/50 dark:text-white/30 dark:hover:text-white/50">
          Login Admin
        </Link>
      </div>
    </div>
  )
}
