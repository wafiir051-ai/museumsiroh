import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { trackClick } from '@/lib/supabase'
import Logo from '@/components/Logo'

const TICKET_URL = import.meta.env.VITE_MUSEUM_TICKET_URL || 'https://tiket.museumsiroh.com'

export default function GoPage() {
  const { refCode } = useParams()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const source = searchParams.get('src') || 'direct'

    trackClick(refCode, source).finally(() => {
      const destination = new URL(TICKET_URL)
      destination.searchParams.set('order', refCode)
      window.location.replace(destination.toString())
    })
  }, [refCode, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-charcoal text-white">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-10" />
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-siroh-orange border-t-transparent" />
        <p className="text-sm text-white/70">Mengarahkan ke Museum Siroh…</p>
      </div>
    </div>
  )
}
