import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { Clock, LogOut } from 'lucide-react'

export default function PendingApprovalPage() {
  const { affiliate, signOut } = useAuth()
  const isSuspended = affiliate?.status === 'suspended'
  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper lattice-bg px-6 dark:bg-siroh-charcoal">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <Logo className="h-9" showText />
        </Link>
        <div className="card p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-siroh-orange/15">
            <Clock className="h-7 w-7 text-siroh-orange" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            {isSuspended ? 'Akun dinonaktifkan' : 'Menunggu persetujuan'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-siroh-ink/65 dark:text-white/65">
            {isSuspended
              ? 'Akses kemitraanmu sedang dinonaktifkan oleh admin. Hubungi tim Museum Siroh untuk informasi lebih lanjut.'
              : 'Pendaftaranmu sedang ditinjau oleh tim kami. Biasanya proses ini selesai dalam 1–2 hari kerja. Kamu akan bisa masuk ke dashboard begitu disetujui.'}
          </p>
          <button onClick={signOut} className="btn-outline mt-7 w-full">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
