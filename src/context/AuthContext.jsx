import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
const AuthContext = createContext(undefined)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [affiliate, setAffiliate] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setAffiliate(null)
      setIsAdmin(false)
      return
    }
    const [{ data: affiliateRow }, { data: adminRow }] = await Promise.all([
      supabase
        .from('affiliates')
        .select('*, tiers(name, commission_rate, badge_color, perks)')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle(),
    ])
    if (!affiliateRow) {
      const pendingRaw = sessionStorage.getItem('siroh_pending')
      const { data: authUserData } = await supabase.auth.getUser()
      const authUser = authUserData?.user

      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw)
          const { data: newAff } = await supabase
            .from('affiliates')
            .insert({ user_id: userId, email: authUser?.email, ...pending })
            .select('*, tiers(name, commission_rate, badge_color, perks)')
            .single()
          sessionStorage.removeItem('siroh_pending')
          setAffiliate(newAff ?? null)
        } catch (e) {
          setAffiliate(null)
        }
      } else if (authUser) {
        // Kemungkinan daftar/login via Google OAuth, belum ada row affiliates.
        // Buat otomatis pakai data dari profil Google (status pending, menunggu approval admin).
        try {
          const meta = authUser.user_metadata || {}
          const fullName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Mitra Baru'
          const { data: newAff, error: createError } = await supabase
            .from('affiliates')
            .insert({ user_id: userId, email: authUser.email, full_name: fullName })
            .select('*, tiers(name, commission_rate, badge_color, perks)')
            .single()
          if (createError) {
            console.error('Gagal membuat profil affiliate dari OAuth:', createError)
            setAffiliate(null)
          } else {
            setAffiliate(newAff ?? null)
          }
        } catch (e) {
          console.error('Gagal membuat profil affiliate dari OAuth:', e)
          setAffiliate(null)
        }
      } else {
        setAffiliate(null)
      }
    } else {
      setAffiliate(affiliateRow)
    }
    setIsAdmin(Boolean(adminRow))
  }, [])
  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return
      setSession(initialSession)
      await loadProfile(initialSession?.user?.id)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await loadProfile(newSession?.user?.id)
    })
    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])
  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session])
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])
  const value = {
    session,
    user: session?.user ?? null,
    affiliate,
    isAdmin,
    loading,
    refreshProfile,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }
  return ctx
}
