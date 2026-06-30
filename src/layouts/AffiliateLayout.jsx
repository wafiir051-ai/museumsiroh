import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, Link2, Wallet, Banknote,
  Sparkles, LogOut, Menu, X, UserCircle
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/links', label: 'Tautan & QR', icon: Link2 },
  { to: '/dashboard/komisi', label: 'Komisi', icon: Wallet },
  { to: '/dashboard/penarikan', label: 'Penarikan', icon: Banknote },
  { to: '/dashboard/toolbox', label: 'Toolbox Promosi', icon: Sparkles },
  { to: '/dashboard/profil', label: 'Profil Saya', icon: UserCircle },
]

export default function AffiliateLayout() {
  const { affiliate, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const tierName = affiliate?.tiers?.name ?? 'Bronze'
  const tierColor = affiliate?.tiers?.badge_color ?? '#A97142'

  return (
    <div className="flex min-h-screen bg-siroh-paper dark:bg-siroh-charcoal">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-siroh-ink/10 bg-white/60 dark:border-white/10 dark:bg-siroh-charcoal2/60 lg:flex">
        <SidebarContent affiliate={affiliate} tierName={tierName} tierColor={tierColor} signOut={signOut} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-siroh-charcoal2">
            <SidebarContent
              affiliate={affiliate}
              tierName={tierName}
              tierColor={tierColor}
              signOut={signOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-siroh-ink/10 bg-white/60 px-6 py-4 dark:border-white/10 dark:bg-siroh-charcoal2/60 lg:hidden">
          <Logo className="h-7" showText />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileOpen(true)} aria-label="Buka menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ affiliate, tierName, tierColor, signOut, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-siroh-ink/10 p-6 dark:border-white/10">
        <Logo className="h-8" showText />
        {onNavigate && (
          <button onClick={onNavigate} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 border-b border-siroh-ink/10 p-6 dark:border-white/10">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-siroh-teal/30 bg-siroh-ink/5 dark:bg-white/5">
          {affiliate?.avatar_url ? (
            <img src={affiliate.avatar_url} alt={affiliate.full_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-siroh-ink/40 dark:text-white/40">
              {affiliate?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-siroh-ink/80 dark:text-white/80">{affiliate?.full_name}</p>
          <span
            className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: tierColor }}
          >
            {tierName}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-siroh-teal/15 text-siroh-teal dark:bg-siroh-teal/15 dark:text-siroh-teal'
                  : 'text-siroh-ink/70 hover:bg-siroh-ink/5 dark:text-white/70 dark:hover:bg-white/5'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-siroh-ink/10 p-4 dark:border-white/10">
        <div className="mb-2 flex justify-center">
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-siroh-rust hover:bg-siroh-rust/10"
        >
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  )
}
