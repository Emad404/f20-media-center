'use client'
import { useLocale } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isRtl = useLocale() === 'ar'
  return (
    <main
      style={{
        flex: 1,
        marginRight: !isMobile && isRtl ? '220px' : 0,
        marginLeft: !isMobile && !isRtl ? '220px' : 0,
        minHeight: '100vh',
      }}
    >
      {children}
    </main>
  )
}
