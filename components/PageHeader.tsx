'use client'

import { useLocale } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import LanguageToggle from '@/components/LanguageToggle'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const isMobile = useIsMobile()
  const isRtl = useLocale() === 'ar'
  // html/body force `direction: rtl` globally (see globals.css), so a plain
  // flex `row` always flows right-to-left regardless of locale. `row-reverse`
  // is what actually flows left-to-right, hence the inverted mapping below.
  const rowDir: React.CSSProperties['flexDirection'] = isRtl ? 'row' : 'row-reverse'

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: isMobile ? '14px 16px' : '20px 32px',
        paddingLeft: isMobile ? (isRtl ? '16px' : '64px') : '32px',
        paddingRight: isMobile ? (isRtl ? '64px' : '16px') : '32px',
        display: 'flex',
        alignItems: isMobile ? (isRtl ? 'flex-start' : 'flex-end') : 'center',
        flexDirection: isMobile ? 'column' : rowDir,
        justifyContent: 'space-between',
        gap: isMobile ? '10px' : '0',
      }}
    >
      <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <h1 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.2, textAlign: isRtl ? 'right' : 'left' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isRtl ? 'right' : 'left' }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: rowDir }}>
        {action}
        <LanguageToggle />
      </div>
    </div>
  )
}
