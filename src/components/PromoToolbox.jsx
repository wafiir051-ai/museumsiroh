// src/components/PromoToolbox.jsx
import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { drawPoster, drawStory, drawFlyer } from '@/lib/posterRenderer'
import { jsPDF } from 'jspdf'

const TEMPLATES = [
  { key: 'poster', title: 'Poster Feed Instagram', size: '1080 x 1080', kind: 'png' },
  { key: 'story', title: 'Story Instagram', size: '1080 x 1920', kind: 'png' },
  { key: 'flyer', title: 'Flyer Cetak A5', size: 'A5 - PDF', kind: 'pdf' },
]

function TemplateCard({ tmpl, refCode, partnerName }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)

    async function render() {
      const canvas = canvasRef.current
      if (!canvas || !refCode) return
      if (tmpl.key === 'poster') await drawPoster(canvas, refCode, partnerName)
      if (tmpl.key === 'story') await drawStory(canvas, refCode)
      if (tmpl.key === 'flyer') await drawFlyer(canvas, refCode, partnerName)
      if (!cancelled) setReady(true)
    }
    render()

    return () => {
      cancelled = true
    }
  }, [tmpl.key, refCode, partnerName])

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    setBusy(true)
    try {
      if (tmpl.kind === 'png') {
        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = tmpl.key + '-' + refCode + '.png'
        a.click()
      } else {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
        const pageW = pdf.internal.pageSize.getWidth()
        const pageH = pdf.internal.pageSize.getHeight()
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH)
        pdf.save('flyer-' + refCode + '.pdf')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-siroh-ink/[0.04] dark:bg-white/[0.06]">
        {!ready && <Loader2 className="h-6 w-6 animate-spin text-siroh-ink/30 dark:text-white/30" />}
        <canvas
          ref={canvasRef}
          className={'h-full w-full object-contain transition-opacity ' + (ready ? 'opacity-100' : 'opacity-0 absolute')}
        />
      </div>
      <p className="text-sm font-semibold">{tmpl.title}</p>
      <p className="text-xs text-siroh-ink/55 dark:text-white/55">{tmpl.size} - kode {refCode}</p>
      <button
        onClick={handleDownload}
        disabled={!ready || busy}
        className="btn-outline mt-1 text-xs disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {tmpl.kind === 'pdf' ? 'Unduh PDF' : 'Unduh PNG'}
      </button>
    </div>
  )
}

export default function PromoToolbox({ refCode, partnerName }) {
  if (!refCode) {
    return (
      <p className="text-sm text-siroh-ink/55 dark:text-white/55">
        Kode referral belum tersedia untuk akun ini.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TEMPLATES.map((tmpl) => (
        <TemplateCard key={tmpl.key} tmpl={tmpl} refCode={refCode} partnerName={partnerName} />
      ))}
    </div>
  )
}
