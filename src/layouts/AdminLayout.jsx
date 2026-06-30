import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, Users, Banknote, Receipt, KeyRound,
  LogOut, Menu, X, ShieldCheck, RefreshCw
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/affiliates', label: 'Mitra', icon: Users },
  { to: '/admin/transactions', label: 'Transaksi', icon: Receipt },
  { to: '/admin/withdrawals', label: 'Penarikan', icon: Banknote },
  { to: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
  { to: '/admin/users', label: 'Admin', icon: ShieldCheck },
  { to: '/admin/sync', label: 'Sync Konversi', icon: RefreshCw },
]


export default function AdminLayout() {
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-siroh-paper dark:bg-siroh-charcoal">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-siroh-ink/10 bg-white/60 dark:border-white/10 dark:bg-siroh-charcoal2/60 lg:flex">
        <SidebarContent signOut={signOut} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-siroh-charcoal2">
            <SidebarContent signOut={signOut} onNavigate={() => setMobileOpen(false)} />
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

function SidebarContent({ signOut, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-siroh-ink/10 p-6 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Logo className="h-8" />
          <div>
            <p className="font-display font-semibold leading-tight">Siroh Partner</p>
            <p className="text-xs text-siroh-ink/50 dark:text-white/50">Admin Panel</p>
          </div>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        )}
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
