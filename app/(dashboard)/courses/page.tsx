'use client'

import { useState, useMemo } from 'react'
import { Clock, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { courses } from '@/data/courses'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function CoursesPage() {
  const isMobile = useIsMobile()
  const [categoryFilter, setCategoryFilter] = useState('الكل')
  const [showRequiredFirst, setShowRequiredFirst] = useState(false)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((c) => c.category)))
    return ['الكل', ...cats]
  }, [])

  const filtered = useMemo(() => {
    const list = courses.filter(
      (c) => categoryFilter === 'الكل' || c.category === categoryFilter
    )
    if (showRequiredFirst) {
      return [...list].sort((a, b) => Number(b.isRequired) - Number(a.isRequired))
    }
    return list
  }, [categoryFilter, showRequiredFirst])

  return (
    <div>
      <PageHeader
        title="الدورات التدريبية"
        subtitle="دورات أضافها المدير التنفيذي للفريق"
      />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
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

        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

        <button
          onClick={() => setShowRequiredFirst(!showRequiredFirst)}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            background: showRequiredFirst ? 'var(--gold)' : 'transparent',
            borderColor: showRequiredFirst ? 'var(--gold)' : 'var(--border-strong)',
            color: showRequiredFirst ? '#fff' : 'var(--text-secondary)',
            transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {showRequiredFirst && <span style={{ fontSize: '11px' }}>✓</span>}
          الإلزامية أولاً
        </button>
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
          {filtered.map((course) => (
            <div
              key={course.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Top row: badges */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge text={course.category} variant="neutral" />
                {course.isRequired && <Badge text="إلزامي" variant="gold" />}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {course.title}
              </h3>

              {/* Provider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <ExternalLink size={12} />
                <span>{course.provider}</span>
              </div>

              {/* Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Clock size={13} />
                <span>{course.duration}</span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  flex: 1,
                }}
              >
                {course.description}
              </p>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  أضافه: {course.addedBy} · {formatArabicDate(course.dateAdded)}
                </span>
                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'var(--gold)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  فتح الدورة ←
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
            لا توجد دورات مطابقة
          </div>
        )}
      </div>
    </div>
  )
}
