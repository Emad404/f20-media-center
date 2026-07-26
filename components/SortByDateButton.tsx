'use client'

import { ArrowDownWideNarrow } from 'lucide-react'

interface SortByDateButtonProps {
  active: boolean
  onToggle: () => void
  label: string
}

export default function SortByDateButton({ active, onToggle, label }: SortByDateButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        border: '1px solid',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        background: active ? 'var(--btn-bg)' : 'transparent',
        borderColor: active ? 'var(--btn-bg)' : 'var(--border-strong)',
        color: active ? 'var(--btn-text)' : 'var(--text-secondary)',
        transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <ArrowDownWideNarrow size={14} />
      {label}
    </button>
  )
}
