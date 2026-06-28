'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const isMobile = useIsMobile()
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: isMobile ? '14px 16px 14px 16px' : '20px 32px',
        paddingRight: isMobile ? '64px' : '32px',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        gap: isMobile ? '10px' : '0',
      }}
    >
      <div>
        <h1 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
