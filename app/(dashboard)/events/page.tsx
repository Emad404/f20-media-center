'use client'

import { useState, useMemo } from 'react'
import { Search, SearchX, CalendarDays, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { kSAEvents } from '@/data/events'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

const cityOrder: Record<string, number> = { 'الرياض': 0, 'الشرقية': 1, 'جدة': 2 }

function cityVariant(city: string): 'riyadh' | 'eastern' | 'jeddah' {
  if (city === 'الرياض') return 'riyadh'
  if (city === 'الشرقية') return 'eastern'
  return 'jeddah'
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
}

export default function EventsPage() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('الكل')
  const [categoryFilter, setCategoryFilter] = useState('الكل')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(kSAEvents.map((e) => e.category)))
    return ['الكل', ...cats]
  }, [])

  const filtered = useMemo(() => {
    return kSAEvents
      .filter((e) => cityFilter === 'الكل' || e.city === cityFilter)
      .filter((e) => categoryFilter === 'الكل' || e.category === categoryFilter)
      .filter(
        (e) =>
          search === '' ||
          e.title.includes(search) ||
          e.description.includes(search)
      )
      .sort((a, b) => {
        const cd = (cityOrder[a.city] ?? 3) - (cityOrder[b.city] ?? 3)
        if (cd !== 0) return cd
        return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
      })
  }, [search, cityFilter, categoryFilter])

  const cities = ['الكل', 'الرياض', 'الشرقية', 'جدة']

  return (
    <div>
      <PageHeader title="فعاليات المملكة" />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', flex: isMobile ? undefined : '1 1 220px', maxWidth: isMobile ? undefined : '320px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="ابحث عن فعالية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingRight: '32px' }}
          />
        </div>

        {/* City label + tabs */}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>المدينة:</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                background: cityFilter === city ? 'var(--gold)' : 'transparent',
                borderColor: cityFilter === city ? 'var(--gold)' : 'var(--border-strong)',
                color: cityFilter === city ? '#fff' : 'var(--text-secondary)',
                transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category label + select */}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>التصنيف:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...inputStyle, width: isMobile ? '100%' : 'auto', cursor: 'pointer' }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
            <SearchX size={36} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
            <p style={{ fontSize: '14px' }}>لا توجد فعاليات مطابقة للبحث</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            {filtered.map((event) => (
              <div
                key={event.id}
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
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
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
                  {/* Status badge overlaid on image */}
                  {event.status === 'جارٍ' && (
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
                  {event.status === 'تاريخ غير محدد' && (
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
                    <Badge text={event.category} variant="neutral" />
                    <Badge text={event.city} variant={cityVariant(event.city)} />
                  </div>

                  <h3 style={{
                    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4,
                  }}>
                    {event.title}
                  </h3>

                  {event.status === 'قادم' && event.dateStart && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)' }}>
                      <CalendarDays size={13} />
                      <span>
                        {event.dateStart === event.dateEnd
                          ? formatArabicDate(event.dateStart)
                          : `${formatArabicDate(event.dateStart)} — ${formatArabicDate(event.dateEnd)}`}
                      </span>
                    </div>
                  )}

                  <p style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5, flex: 1,
                  }}>
                    {event.description}
                  </p>

                  {event.link && (
                    <a
                      href={event.link}
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
