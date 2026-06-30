import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PendingApprovalPage from '@/pages/PendingApprovalPage'
import GoPage from '@/pages/GoPage'

import AffiliateLayout from '@/layouts/AffiliateLayout'
import DashboardPage from '@/pages/affiliate/DashboardPage'
import LinksPage from '@/pages/affiliate/LinksPage'
import CommissionsPage from '@/pages/affiliate/CommissionsPage'
import WithdrawPage from '@/pages/affiliate/WithdrawPage'
import ToolboxPage from '@/pages/affiliate/ToolboxPage'
import ProfilePage from '@/pages/affiliate/ProfilePage'

import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminAffiliates from '@/pages/admin/AdminAffiliates'
import AdminWithdrawals from '@/pages/admin/AdminWithdrawals'
import AdminTransactions from '@/pages/admin/AdminTransactions'
import AdminApiKeys from '@/pages/admin/AdminApiKeys'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminSetupPage from '@/pages/AdminSetupPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminSyncPage from '@/pages/admin/AdminSyncPage'

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-siroh-paper">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-siroh-gold border-t-transparent" />
        <p className="font-body text-sm text-siroh-ink/60">Memuat…</p>
      </div>
    </div>
  )
}

function RequireAffiliate({ children }) {
  const { user, affiliate, loading } = useAuth()
  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/login" replace />
  if (!affiliate) return <Navigate to="/register" replace />
  if (affiliate.status === 'pending') return <Navigate to="/menunggu-approval" replace />
  if (affiliate.status === 'suspended') return <Navigate to="/menunggu-approval" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/menunggu-approval" element={<PendingApprovalPage />} />
      <Route path="/go/:refCode" element={<GoPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/setup" element={<AdminSetupPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAffiliate>
            <AffiliateLayout />
          </RequireAffiliate>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="komisi" element={<CommissionsPage />} />
        <Route path="penarikan" element={<WithdrawPage />} />
        <Route path="toolbox" element={<ToolboxPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="affiliates" element={<AdminAffiliates />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="api-keys" element={<AdminApiKeys />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="sync" element={<AdminSyncPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
