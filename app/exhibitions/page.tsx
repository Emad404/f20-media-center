'use client'

import { useState, useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { exhibitions } from '@/data/exhibitions'
import { formatArabicDate } from '@/lib/dateUtils'

function cityBadgeVariant(city: string): 'riyadh' | 'eastern' | 'jeddah' | 'neutral' {
  if (city === 'الرياض') return 'riyadh'
  if (city === 'الشرقية') return 'eastern'
  if (city === 'جدة') return 'jeddah'
  return 'neutral'
}

function catBadgeVariant(cat: string): 'neutral' | 'info' | 'gold' {
  if (cat === 'معرض') return 'neutral'
  if (cat === 'مؤتمر') return 'info'
  return 'gold'
}

export default function ExhibitionsPage() {
  const [categoryFilter, setCategoryFilter] = useState('الكل')
  const [cityFilter, setCityFilter] = useState('الكل')

  const cities = useMemo(() => {
    const cs = Array.from(new Set(exhibitions.map((e) => e.city)))
    return ['الكل', ...cs]
  }, [])

  const filtered = useMemo(() => {
    return exhibitions
      .filter((e) => categoryFilter === 'الكل' || e.category === categoryFilter)
      .filter((e) => cityFilter === 'الكل' || e.city === cityFilter)
  }, [categoryFilter, cityFilter])

  const categories = ['الكل', 'معرض', 'مؤتمر', 'ملتقى']

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? 'var(--gold)' : 'transparent',
    borderColor: active ? 'var(--gold)' : 'var(--border-strong)',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  })

  return (
    <div>
      <PageHeader title="المعارض والمؤتمرات" />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>النوع:</span>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} style={btnStyle(categoryFilter === cat)}>
            {cat}
          </button>
        ))}
        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>المدينة:</span>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            لا توجد نتائج مطابقة
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filtered.map((ex) => (
              <div
                key={ex.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                {/* Image */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                  backgroundColor: '#F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {ex.image ? (
                    <img
                      src={ex.image}
                      alt={ex.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      background: 'var(--neutral-bg)',
                    }}>
                      لا توجد صورة
                    </div>
                  )}
                  {ex.status === 'جارٍ' && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: '#16a34a', color: '#fff',
                      fontSize: '11px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                      يعمل الآن
                    </span>
                  )}
                  {ex.status === 'تاريخ غير محدد' && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      fontSize: '11px', fontWeight: 500,
                      padding: '3px 10px', borderRadius: '20px',
                    }}>
                      تاريخ غير محدد
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Badge text={ex.category} variant={catBadgeVariant(ex.category)} />
                    <Badge text={ex.city} variant={cityBadgeVariant(ex.city)} />
                  </div>

                  <h3 style={{
                    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4,
                  }}>
                    {ex.title}
                  </h3>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {ex.organizer}
                  </div>

                  {ex.status === 'قادم' && ex.dateStart && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {ex.dateStart === ex.dateEnd
                        ? formatArabicDate(ex.dateStart)
                        : `${formatArabicDate(ex.dateStart)} — ${formatArabicDate(ex.dateEnd)}`}
                    </div>
                  )}

                  <p style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5, flex: 1,
                  }}>
                    {ex.description}
                  </p>

                  {ex.registrationLink && (
                    <a
                      href={ex.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        marginTop: 4,
                        background: 'var(--gold)', color: '#fff',
                        borderRadius: '8px', padding: '7px 14px',
                        fontSize: '13px', fontWeight: 500,
                        textDecoration: 'none', alignSelf: 'flex-start',
                      }}
                    >
                      الموقع الرسمي <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
