'use client'

import { Mail, Phone } from 'lucide-react'

interface PersonCardProps {
  name: string
  jobTitle?: string | null
  subtitle?: string | null
  email?: string | null
  phone?: string | null
  imageUrl?: string | null
  isRtl: boolean
  menu?: React.ReactNode
  extra?: React.ReactNode
}

export default function PersonCard({ name, jobTitle, subtitle, email, phone, imageUrl, isRtl, menu, extra }: PersonCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '24px 20px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {menu && (
        <div style={{ position: 'absolute', top: '16px', [isRtl ? 'left' : 'right']: '16px' }}>
          {menu}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <img
          src={imageUrl || '/employee_placeholder.png'}
          alt={name}
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', background: 'var(--neutral-bg)', marginBottom: 14 }}
        />
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        {jobTitle && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            {jobTitle}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0 12px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {email && (
          <a href={`mailto:${email}`} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', overflow: 'hidden' }}>
            <Mail size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
          </a>
        )}
        {phone && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} /> {phone}
          </span>
        )}
        {extra}
      </div>
    </div>
  )
}
