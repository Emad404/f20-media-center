'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { worldDays } from '@/data/worldDays'
import { formatArabicDate } from '@/lib/dateUtils'

const categoryColors: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'gold'> = {
  'صحة': 'success',
  'بيئة': 'success',
  'مجتمع': 'info',
  'وطني': 'warning',
  'ثقافة': 'info',
  'شباب': 'info',
  'تعليم': 'info',
  'سلامة': 'neutral',
}

export default function WorldDaysPage() {
  const [categoryFilter, setCategoryFilter] = useState('الكل')
  const [nationalOnly, setNationalOnly] = useState(false)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(worldDays.map((d) => d.category)))
    return ['الكل', ...cats]
  }, [])

  const filtered = useMemo(() => {
    return worldDays
      .filter((d) => !nationalOnly || d.isNational)
      .filter((d) => categoryFilter === 'الكل' || d.category === categoryFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [categoryFilter, nationalOnly])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const day of filtered) {
      const key = new Date(day.date).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(day)
    }
    return map
  }, [filtered])

  return (
    <div>
      <PageHeader title="الأيام العالمية" />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: '1px solid',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: categoryFilter === cat ? 'var(--gold)' : 'transparent',
              borderColor: categoryFilter === cat ? 'var(--gold)' : 'var(--border-strong)',
              color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}

        
      </div>

      <div style={{ padding: '28px 32px' }}>
        {grouped.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            لا توجد أيام مطابقة
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Array.from(grouped.entries()).map(([month, days]) => (
              <div key={month}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--navy)',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    marginBottom: '12px',
                  }}
                >
                  {month}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {days.map((day) => {
                    const dateObj = new Date(day.date)
                    const dayNum = dateObj.getDate()
                    return (
                      <div
                        key={day.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: day.isNational ? 'rgba(253,243,220,0.4)' : 'transparent',
                        }}
                      >
                        {/* Date circle */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: day.isNational ? 'var(--gold-light)' : 'var(--neutral-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: day.isNational ? 'var(--gold-dark)' : 'var(--text-secondary)',
                            flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {dayNum}
                        </div>

                        {/* Title */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {day.title}
                            </span>
                            {day.isNational && (
                              <span
                                style={{ color: 'var(--gold)', fontSize: '14px' }}
                                title="يوم وطني"
                              >
                                ★
                              </span>
                            )}
                            <Badge
                              text={day.category}
                              variant={categoryColors[day.category] ?? 'neutral'}
                            />
                          </div>
                        </div>

                        {/* Full date */}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {formatArabicDate(day.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
