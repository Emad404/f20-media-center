'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name_ar: string
  full_name_en: string
  role: string
  job_title_ar: string
  job_title_en: string
  department_ar: string
  department_en: string
  phone: string
  profile_image_url: string | null
  birthday: string | null
  created_at: string
}

interface UserProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  // Only ever ADDS access on top of role checks; false until the RPC succeeds.
  hasExtendedAccess: boolean
  refreshProfile: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasExtendedAccess, setHasExtendedAccess] = useState(false)

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
      }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await refreshProfile()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!profile?.id) {
      setHasExtendedAccess(false)
      return
    }
    let cancelled = false
    const check = async () => {
      const { data, error } = await supabase.rpc('has_extended_access')
      if (!cancelled) setHasExtendedAccess(!error && !!data)
    }
    check()
    return () => {
      cancelled = true
    }
  }, [profile?.id])

  return (
    <UserProfileContext.Provider value={{ profile, loading, hasExtendedAccess, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext)
  if (!ctx) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return ctx
}
