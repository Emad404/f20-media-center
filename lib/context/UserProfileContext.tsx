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
  created_at: string
}

interface UserProfileContextValue {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <UserProfileContext.Provider value={{ profile, loading, refreshProfile }}>
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
