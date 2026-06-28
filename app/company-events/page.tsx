'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, MapPin, CalendarDays } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Avatar from '@/components/Avatar'
import { companyEvents } from '@/data/companyEvents'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'جارٍ' || status === 'جاري'
  const isUpcoming = status === 'قادم'
  if (isUpcoming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--gold-light)', color: 'var(--gold-dark)', whiteSpace: 'nowrap' }}>
        {status}
      </span>
    )
  }
  if (isActive) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--success-bg)', color: 'var(--success-text)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-text)', display: 'inline-block', marginLeft: 6 }} />
        {status}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--neutral-bg)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

export default function CompanyEventsPage() {
  const isMobile = useIsMobile()
  const [statusFilter, setStatusFilter] = useState('الكل')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return companyEvents.filter(
      (e) => statusFilter === 'الكل' || e.status === statusFilter
    )
  }, [statusFilter])

  const statuses = ['الكل', 'قادم', 'جاري', 'منتهي']

  return (
    <div>
      <PageHeader title="فعاليات الشركة" />

      {/* Status tabs */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: statusFilter === s ? 'var(--gold)' : 'transparent',
              borderColor: statusFilter === s ? 'var(--gold)' : 'var(--border-strong)',
              color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((event) => {
          const isExpanded = expandedId === event.id
          return (
            <div
              key={event.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: isMobile ? '14px 16px' : '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {event.title}
                    </h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {event.client}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <MapPin size={13} />
                      <span>{event.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <CalendarDays size={13} />
                      <span>
                        {event.dateStart === event.dateEnd
                          ? formatArabicDate(event.dateStart)
                          : `${formatArabicDate(event.dateStart)} — ${formatArabicDate(event.dateEnd)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  {/* Stacked avatars */}
                  <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                    {event.teamMembers.slice(0, 4).map((member, idx) => (
                      <div key={idx} style={{ marginLeft: idx === 0 ? 0 : isMobile ? '-4px' : '-8px' }}>
                        <Avatar name={member} size="sm" />
                      </div>
                    ))}
                    {event.teamMembers.length > 4 && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--neutral-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                          marginLeft: '-8px',
                        }}
                      >
                        +{event.teamMembers.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Requirements */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      المتطلبات
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {event.requirements.map((req, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'var(--neutral-bg)',
                            color: 'var(--neutral-text)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Team members */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      فريق العمل
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {event.teamMembers.map((member, idx) => (
                        <div
                          key={idx}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Avatar name={member} size="sm" />
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {event.notes && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        ملاحظات
                      </div>
                      <div
                        style={{
                          background: 'var(--neutral-bg)',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}
                      >
                        {event.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
            لا توجد فعاليات مطابقة
          </div>
        )}
      </div>
    </div>
  )
}
