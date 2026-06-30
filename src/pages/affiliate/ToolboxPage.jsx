import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Copy, Check, MessageCircle, Instagram, Download, ImageIcon } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

const CAPTIONS = [
  {
    channel: 'WhatsApp',
    icon: MessageCircle,
    color: '#1B7B5A',
    text:
      'Assalamualaikum! 🕌\n\nMau ajak ngaji sambil jalan-jalan? Yuk kunjungi Museum Siroh — rasakan langsung perjalanan sejarah Islam lewat pameran interaktif yang bikin merinding.\n\nPesan tiketnya di sini ya:\n{LINK}\n\nCocok buat keluarga, rombongan sekolah, atau kajian bareng. Yuk ajak yang lain juga! 🤲',
  },
  {
    channel: 'WhatsApp (Singkat)',
    icon: MessageCircle,
    color: '#1B7B5A',
    text:
      'Museum Siroh — wisata sejarah Islam yang bikin nagih buat balik lagi 🕌\n\nTiket di sini: {LINK}',
  },
  {
    channel: 'Instagram Caption',
    icon: Instagram,
    color: '#C9A84C',
    text:
      'Pernah kebayang gimana rasanya berjalan di lorong waktu, menyaksikan jejak peradaban Islam dari masa ke masa? 🕌✨\n\nDi Museum Siroh, semua itu jadi nyata.\n\n📍 Link tiket di bio / komen\n🔗 {LINK}\n\n#MuseumSiroh #WisataEdukasi #SejarahIslam',
  },
]

const POSTER_IDEAS = [
  { title: 'Poster Feed Instagram (1080x1080)', desc: 'Visual hero museum + QR code + headline singkat' },
  { title: 'Story Instagram (1080x1920)', desc: 'Swipe-up style dengan tombol "Pesan Tiket"' },
  { title: 'Flyer Cetak A5', desc: 'Untuk ditempel di masjid, sekolah, atau majelis taklim' },
]

export default function ToolboxPage() {
  const { affiliate } = useAuth()
  const [copiedIndex, setCopiedIndex] = useState(null)

  const refLink = `${APP_URL}/go/${affiliate?.ref_code ?? ''}`

  function copyCaption(index, template) {
    const text = template.replace('{LINK}', refLink)
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Toolbox Promosi</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">
          Konten siap pakai supaya kamu tinggal salin-tempel, tanpa pusing mikir mau posting apa.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Caption Siap Pakai</h2>
        {CAPTIONS.map((c, i) => (
          <div key={c.channel} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.color + '1A' }}
                >
                  <c.icon className="h-4 w-4" style={{ color: c.color }} />
                </div>
                <span className="font-medium">{c.channel}</span>
              </div>
              <button
                onClick={() => copyCaption(i, c.text)}
                className="flex items-center gap-1.5 rounded-lg bg-siroh-green px-3 py-1.5 text-xs font-semibold text-siroh-paper hover:bg-siroh-emerald"
              >
                {copiedIndex === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedIndex === i ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line rounded-xl bg-siroh-ink/[0.04] p-4 text-sm leading-relaxed text-siroh-ink/75 dark:bg-white/[0.06] dark:text-white/80">
              {c.text.replace('{LINK}', refLink)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Template Visual</h2>
        <p className="text-sm text-siroh-ink/55 dark:text-white/55">
          Unduh dan sesuaikan dengan tautanmu. (Template akan tersedia setelah aset desain ditambahkan oleh admin.)
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {POSTER_IDEAS.map((p) => (
            <div key={p.title} className="card flex flex-col gap-3 p-5">
              <div className="flex h-24 items-center justify-center rounded-xl bg-siroh-ink/[0.04] dark:bg-white/[0.06]">
                <ImageIcon className="h-8 w-8 text-siroh-ink/25 dark:text-white/25" />
              </div>
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="text-xs text-siroh-ink/55 dark:text-white/55">{p.desc}</p>
              <button disabled className="btn-outline mt-1 text-xs opacity-50">
                <Download className="h-3.5 w-3.5" /> Segera Hadir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
