'use client'

interface BadgeProps {
  text: string
  variant: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'riyadh' | 'eastern' | 'jeddah'
}

const variantStyles: Record<BadgeProps['variant'], { background: string; color: string }> = {
  gold: { background: 'var(--gold-light)', color: 'var(--gold-dark)' },
  success: { background: 'var(--success-bg)', color: 'var(--success-text)' },
  warning: { background: 'var(--warning-bg)', color: 'var(--warning-text)' },
  danger: { background: 'var(--danger-bg)', color: 'var(--danger-text)' },
  info: { background: 'var(--info-bg)', color: 'var(--info-text)' },
  neutral: { background: 'var(--neutral-bg)', color: 'var(--neutral-text)' },
  riyadh: { background: 'var(--riyadh-bg)', color: 'var(--riyadh-text)' },
  eastern: { background: 'var(--eastern-bg)', color: 'var(--eastern-text)' },
  jeddah: { background: 'var(--jeddah-bg)', color: 'var(--jeddah-text)' },
}

export default function Badge({ text, variant }: BadgeProps) {
  const styles = variantStyles[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...styles,
      }}
    >
      {text}
    </span>
  )
}
