'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

interface PersonCardMenuProps {
  isRtl: boolean
  optionsAria: string
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
}

export default function PersonCardMenu({ isRtl, optionsAria, editLabel, deleteLabel, onEdit, onDelete }: PersonCardMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: isRtl ? 'right' : 'left',
    fontFamily: 'inherit',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={optionsAria}
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '38px',
            [isRtl ? 'left' : 'right']: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 10,
            minWidth: '140px',
          }}
        >
          <button
            onClick={() => { setOpen(false); onEdit() }}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Pencil size={13} /> {editLabel}
          </button>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            style={{ ...menuItemStyle, color: 'var(--danger-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={13} /> {deleteLabel}
          </button>
        </div>
      )}
    </div>
  )
}
