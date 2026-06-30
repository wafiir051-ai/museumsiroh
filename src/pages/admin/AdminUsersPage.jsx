import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserPlus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchAdmins() {
    const { data } = await supabase.from('admins').select('*').order('created_at')
    setAdmins(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleAdd(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password.length < 6) { setError('Kata sandi minimal 6 karakter.'); return }
    setAdding(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })
    if (signUpError) { setAdding(false); setError(signUpError.message); return }

    const userId = signUpData.user?.id
    if (!userId) { setAdding(false); setError('Gagal mendapatkan user ID.'); return }

    const { error: insertError } = await supabase
      .from('admins').insert({ user_id: userId, full_name: form.fullName })
    if (insertError) { setAdding(false); setError('Gagal tambah admin: ' + insertError.message); return }

    setAdding(false)
    setSuccess(`Admin ${form.fullName} berhasil ditambahkan.`)
    setForm({ fullName: '', email: '', password: '' })
    fetchAdmins()
  }

  async function handleDelete(userId, name) {
    if (!confirm(`Hapus admin "${name}"?`)) return
    await supabase.from('admins').delete().eq('user_id', userId)
    fetchAdmins()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Manajemen Admin</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">Tambah atau hapus akun admin.</p>
      </div>

      {/* Form tambah admin */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-siroh-orange" /> Tambah Admin Baru
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Nama Lengkap</label>
            <input required value={form.fullName} onChange={set('fullName')} className="input-field" placeholder="Nama admin" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Email</label>
            <input type="email" required value={form.email} onChange={set('email')} className="input-field" placeholder="admin@email.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Kata Sandi</label>
            <input type="password" required value={form.password} onChange={set('password')} className="input-field" placeholder="Min. 6 karakter" />
          </div>
          {error && (
            <div className="sm:col-span-3 flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="sm:col-span-3 flex items-start gap-2 rounded-xl bg-siroh-teal/10 p-3 text-sm text-siroh-teal">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />{success}
            </div>
          )}
          <div className="sm:col-span-3">
            <button type="submit" disabled={adding} className="btn-gold disabled:opacity-60">
              {adding ? 'Menambahkan…' : 'Tambah Admin'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar admin */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Daftar Admin</h2>
        {loading ? (
          <p className="text-sm text-siroh-ink/50 dark:text-white/50">Memuat…</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-siroh-ink/50 dark:text-white/50">Belum ada admin.</p>
        ) : (
          <div className="divide-y divide-siroh-ink/10 dark:divide-white/10">
            {admins.map(a => (
              <div key={a.user_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{a.full_name}</p>
                  <p className="text-xs text-siroh-ink/50 dark:text-white/50">{a.user_id}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.user_id, a.full_name)}
                  className="p-2 rounded-lg text-siroh-rust hover:bg-siroh-rust/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
