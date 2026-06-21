'use client'

import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  value: string | number
  label: string
  icon?: LucideIcon
  trend?: string
}

export default function StatCard({ value, label, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--navy)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
          {trend && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{trend}</div>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'var(--gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} style={{ color: 'var(--gold-dark)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
