import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import {
  ArrowRight, Link2, BadgeCheck, Wallet,
  TrendingUp, ShieldCheck, Sparkles
} from 'lucide-react'

const STEPS = [
  {
    icon: BadgeCheck,
    title: 'Daftar & disetujui',
    desc: 'Isi formulir pendaftaran singkat. Tim kami meninjau dan menyetujui dalam 1–2 hari kerja.',
  },
  {
    icon: Link2,
    title: 'Sebarkan tautanmu',
    desc: 'Setiap mitra mendapat kode rujukan unik beserta QR code, siap dibagikan online maupun offline.',
  },
  {
    icon: Wallet,
    title: 'Tiket terjual, komisi cair',
    desc: 'Setiap transaksi tiket lewat tautanmu tercatat otomatis. Ajukan penarikan kapan saja.',
  },
]

export default function LandingPage() {
  const [tiers, setTiers] = useState([])

  useEffect(() => {
    supabase
      .from('tiers')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data }) => setTiers(data ?? []))
  }, [])

  return (
    <div className="min-h-screen bg-siroh-paper text-siroh-ink dark:bg-siroh-charcoal dark:text-white">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-siroh-ink/10 bg-siroh-paper/90 backdrop-blur-md dark:border-white/10 dark:bg-siroh-charcoal/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="h-8" showText />
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-siroh-ink/70 hover:text-siroh-ink dark:text-white/70 dark:hover:text-white">
              Masuk
            </Link>
            <Link to="/register" className="btn-gold text-sm">
              Jadi Mitra <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="lattice-bg relative overflow-hidden border-b border-siroh-ink/10 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-siroh-orange/40 bg-siroh-orange/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-siroh-orange">
              <Sparkles className="h-3.5 w-3.5" /> Program Mitra Resmi
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Setiap kisah yang kau sebarkan, <span className="text-siroh-orange">membawa pulang komisi.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-siroh-ink/70 dark:text-white/70">
              Museum Siroh menghidupkan perjalanan sejarah Islam. Bergabunglah sebagai mitra,
              sebarkan tautan tiketmu, dan dapatkan komisi hingga 20% dari setiap kunjungan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-gold">
                Daftar Jadi Mitra <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#cara-kerja" className="btn-outline">
                Lihat Cara Kerja
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm rounded-3xl border border-siroh-teal/30 bg-siroh-charcoal2 p-8 text-white shadow-xl">
              <p className="text-xs uppercase tracking-widest text-siroh-teal/80">Tautan Mitramu</p>
              <p className="mt-2 break-all font-mono text-sm text-white/90">
                tiket.museumsiroh.com<span className="text-siroh-orange">?order=AB12CD</span>
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="font-display text-2xl font-semibold text-siroh-teal">248</p>
                  <p className="text-xs text-white/60">Klik</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-siroh-teal">37</p>
                  <p className="text-xs text-white/60">Tiket Terjual</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-siroh-teal">Rp890K</p>
                  <p className="text-xs text-white/60">Komisi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-siroh-orange">Cara Kerja</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Tiga langkah, tanpa rumit.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card flex flex-col gap-4 p-7">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siroh-teal/10">
                  <step.icon className="h-5 w-5 text-siroh-teal" />
                </div>
                <span className="font-display text-3xl font-semibold text-siroh-orange/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-siroh-ink/65 dark:text-white/65">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIER KOMISI */}
      <section className="border-y border-siroh-ink/10 bg-siroh-ink/[0.02] py-20 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-siroh-orange">Struktur Komisi</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Makin aktif, makin tinggi tingkatmu.
            </h2>
            <p className="mt-3 text-siroh-ink/65 dark:text-white/65">
              Komisi naik otomatis seiring jumlah tiket yang berhasil terjual lewat tautanmu.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(tiers.length ? tiers : FALLBACK_TIERS).map((tier) => (
              <div key={tier.name} className="card relative flex flex-col gap-3 overflow-hidden p-6">
                <div
                  className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full opacity-20"
                  style={{ backgroundColor: tier.badge_color }}
                />
                <span
                  className="w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: tier.badge_color }}
                >
                  {tier.name}
                </span>
                <p className="font-display text-3xl font-semibold">
                  {tier.commission_rate}%
                </p>
                <p className="text-xs text-siroh-ink/55 dark:text-white/55">
                  Min. {tier.min_conversions} tiket terjual
                </p>
                <ul className="mt-2 space-y-1.5 border-t border-siroh-ink/10 pt-3 text-sm text-siroh-ink/70 dark:border-white/10 dark:text-white/70">
                  {(tier.perks ?? []).map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-siroh-orange" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA AKHIR */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-siroh-orange" />
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Jadilah bagian dari penyebar kisah Siroh.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-siroh-ink/65 dark:text-white/65">
          Pendaftaran gratis. Tidak ada biaya tersembunyi. Komisi cair langsung ke rekeningmu.
        </p>
        <Link to="/register" className="btn-gold mt-7 inline-flex">
          Daftar Sekarang <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-siroh-ink/10 py-8 text-center text-sm text-siroh-ink/50 dark:border-white/10 dark:text-white/50">
        © {new Date().getFullYear()} Museum Siroh — Program Mitra Afiliasi
      </footer>
    </div>
  )
}

const FALLBACK_TIERS = [
  { name: 'Bronze', commission_rate: 10, min_conversions: 0, badge_color: '#A97142', perks: ['Komisi 10%', 'Akses toolbox dasar'] },
  { name: 'Silver', commission_rate: 13, min_conversions: 10, badge_color: '#9CA3AF', perks: ['Komisi 13%', 'Toolbox lengkap'] },
  { name: 'Gold', commission_rate: 16, min_conversions: 30, badge_color: '#2DD4BF', perks: ['Komisi 16%', 'Priority payout'] },
  { name: 'Platinum', commission_rate: 20, min_conversions: 75, badge_color: '#E8923C', perks: ['Komisi 20%', 'QR offline custom'] },
]
