import logoImg from '@/assets/logo.webp'

export default function Logo({ className = 'h-8', showText = false }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logoImg} alt="Museum Siroh Nabawiyah" className={className} />
      {showText && (
        <span className="font-display text-lg font-semibold tracking-tight">Siroh Partner</span>
      )}
    </div>
  )
}
