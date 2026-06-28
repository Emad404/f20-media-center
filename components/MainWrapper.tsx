'use client'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  return (
    <main style={{ flex: 1, marginRight: isMobile ? 0 : '220px', minHeight: '100vh' }}>
      {children}
    </main>
  )
}
