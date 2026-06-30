import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  User, Mail, Phone, Lock, Banknote, Camera,
  Save, AlertCircle, CheckCircle, Loader2
} from 'lucide-react'

export default function ProfilePage() {
  const { affiliate, user, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    bank_name: '',
    bank_account_no: '',
    bank_account_name: '',
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (affiliate) {
      setForm({
        full_name: affiliate.full_name ?? '',
        phone: affiliate.phone ?? '',
        bank_name: affiliate.bank_name ?? '',
        bank_account_no: affiliate.bank_account_no ?? '',
        bank_account_name: affiliate.bank_account_name ?? '',
      })
      setAvatarPreview(affiliate.avatar_url ?? null)
    }
  }, [affiliate])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handlePickFile() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 3MB.')
      return
    }

    setError('')
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatarIfNeeded() {
    if (!avatarFile || !user) return affiliate?.avatar_url ?? null

    setUploadingAvatar(true)
    const ext = avatarFile.name.split('.').pop()
    const path = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })

    if (uploadError) {
      setUploadingAvatar(false)
      throw new Error('Gagal upload foto: ' + uploadError.message)
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
    setUploadingAvatar(false)
    return publicUrlData.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.')
        return
      }
    }

    setSaving(true)

    try {
      const avatarUrl = await uploadAvatarIfNeeded()

      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          bank_name: form.bank_name || null,
          bank_account_no: form.bank_account_no || null,
          bank_account_name: form.bank_account_name || null,
          avatar_url: avatarUrl,
        })
        .eq('id', affiliate.id)

      if (updateError) throw new Error('Gagal menyimpan profil: ' + updateError.message)

      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
        if (pwError) throw new Error('Profil tersimpan, tapi gagal ganti kata sandi: ' + pwError.message)
        setNewPassword('')
        setConfirmPassword('')
      }

      await refreshProfile()
      setAvatarFile(null)
      setSuccess('Profil berhasil diperbarui.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!affiliate) {
    return <p className="text-sm text-siroh-ink/50 dark:text-white/50">Memuat profil…</p>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profil Saya</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">
          Kelola informasi akun, foto profil, dan data rekening kamu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card flex items-center gap-5 p-6">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-siroh-teal/30 bg-siroh-ink/5 dark:bg-white/5">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-siroh-ink/30 dark:text-white/30">
                  {form.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePickFile}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-siroh-orange text-white shadow-sm hover:bg-siroh-orangelight"
              aria-label="Ganti foto profil"
            >
              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-siroh-ink dark:text-white">{form.full_name || 'Mitra'}</p>
            <p className="text-xs text-siroh-ink/55 dark:text-white/55">{user?.email}</p>
            <button
              type="button"
              onClick={handlePickFile}
              className="mt-2 text-xs font-semibold text-siroh-teal hover:underline"
            >
              Ganti foto
            </button>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Informasi Dasar</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
              <input
                required
                value={form.full_name}
                onChange={update('full_name')}
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">
              Email
              <span className="ml-2 text-xs font-normal text-siroh-ink/40 dark:text-white/40">(tidak bisa diubah)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
              <input
                disabled
                value={user?.email ?? ''}
                className="input-field pl-11 opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">No. WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-siroh-ink/40 dark:text-white/40" />
              <input
                value={form.phone}
                onChange={update('phone')}
                className="input-field pl-11"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-4 w-4 text-siroh-orange" /> Informasi Rekening
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Nama Bank</label>
            <input
              value={form.bank_name}
              onChange={update('bank_name')}
              className="input-field"
              placeholder="cth. BCA, Mandiri, BSI"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Nomor Rekening</label>
            <input
              value={form.bank_account_no}
              onChange={update('bank_account_no')}
              className="input-field"
              placeholder="Nomor rekening"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Nama Pemilik Rekening</label>
            <input
              value={form.bank_account_name}
              onChange={update('bank_account_name')}
              className="input-field"
              placeholder="Sesuai buku tabungan"
            />
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-siroh-orange" /> Ganti Kata Sandi
          </h2>
          <p className="text-xs text-siroh-ink/55 dark:text-white/55">Kosongkan jika tidak ingin mengubah kata sandi.</p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Kata Sandi Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-siroh-ink/80 dark:text-white/80">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Ulangi kata sandi baru"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-siroh-rust/10 p-3 text-sm text-siroh-rust">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-siroh-teal/10 p-3 text-sm text-siroh-teal">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <button type="submit" disabled={saving || uploadingAvatar} className="btn-gold disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}
