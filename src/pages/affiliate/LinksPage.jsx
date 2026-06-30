import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, Download, MessageCircle, Instagram, QrCode } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function LinksPage() {
  const { affiliate } = useAuth()
  const [copied, setCopied] = useState(false)

  const refCode = affiliate?.ref_code ?? ''
  const baseLink = `${APP_URL}/go/${refCode}`

  const channels = [
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#1B7B5A' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#C9A84C' },
    { key: 'offline-qr', label: 'QR Offline', icon: QrCode, color: '#1B4D3E' },
  ]

  function linkFor(source) {
    return `${baseLink}?src=${source}`
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const canvas = document.getElementById('siroh-qr-canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `siroh-qr-${refCode}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Tautan & QR Code</h1>
        <p className="mt-1 text-sm text-siroh-ink/60 dark:text-white/60">
          Gunakan tautan khusus per channel agar tahu sumber klik mana yang paling efektif.
        </p>
      </div>

      <div className="card p-6">
        <p className="text-sm font-medium text-siroh-ink/70 dark:text-white/70">Kode Rujukanmu</p>
        <p className="mt-1 font-mono text-2xl font-semibold text-siroh-orange">{refCode}</p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-siroh-green/15 bg-siroh-green/5 p-3 dark:border-white/15 dark:bg-white/5">
          <code className="flex-1 truncate text-sm dark:text-white/85">{baseLink}</code>
          <button
            onClick={() => copyToClipboard(baseLink)}
            className="flex items-center gap-1.5 rounded-lg bg-siroh-green px-3 py-1.5 text-xs font-semibold text-siroh-paper hover:bg-siroh-emerald"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold">Tautan per Channel</h2>
          <p className="mt-1 text-sm text-siroh-ink/55 dark:text-white/55">
            Tiap tautan menyimpan info sumber, jadi statistikmu lebih rinci.
          </p>
          <div className="mt-4 space-y-3">
            {channels.map((ch) => (
              <div
                key={ch.key}
                className="flex items-center justify-between rounded-xl border border-siroh-green/10 dark:border-white/10 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ch.color + '1A' }}
                  >
                    <ch.icon className="h-4 w-4" style={{ color: ch.color }} />
                  </div>
                  <span className="text-sm font-medium dark:text-white/85">{ch.label}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(linkFor(ch.key))}
                  className="text-xs font-semibold text-siroh-green hover:underline"
                >
                  Salin tautan
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col items-center p-6 text-center">
          <h2 className="font-display text-lg font-semibold">QR Code Offline</h2>
          <p className="mt-1 text-sm text-siroh-ink/55 dark:text-white/55">
            Cetak dan tempel di kajian, sekolah, atau majelis taklim.
          </p>
          <div className="mt-5 rounded-2xl border border-siroh-orange/30 bg-white p-4">
            <QRCodeCanvas
              id="siroh-qr-canvas"
              value={linkFor('offline-qr')}
              size={180}
              fgColor="#0F2C22"
              level="H"
              includeMargin
            />
          </div>
          <button onClick={downloadQR} className="btn-outline mt-5">
            <Download className="h-4 w-4" /> Unduh QR Code
          </button>
        </div>
      </div>
    </div>
  )
}
