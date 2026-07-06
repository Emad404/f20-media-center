'use client'

import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import StarRating from '@/components/StarRating'
import Avatar from '@/components/Avatar'
import { kSAEvents } from '@/data/events'
import { worldDays } from '@/data/worldDays'
import { companyEvents } from '@/data/companyEvents'
import { reports } from '@/data/reports'
import { socialAccounts } from '@/data/social'
import { formatArabicDate } from '@/lib/dateUtils'
import { CalendarDays, Globe, Building2, Users, Mail, ExternalLink } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

const today = new Date('2026-06-19')

const upcomingEvents = kSAEvents
  .filter((e) => new Date(e.dateStart) >= today)
  .sort((a, b) => {
    const cityOrder: Record<string, number> = { 'الرياض': 0, 'الشرقية': 1, 'جدة': 2 }
    const cityDiff = (cityOrder[a.city] ?? 3) - (cityOrder[b.city] ?? 3)
    if (cityDiff !== 0) return cityDiff
    return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
  })
  .slice(0, 5)

const upcomingWorldDays = worldDays
  .filter((d) => new Date(d.date) >= today)
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 4)

function cityVariant(city: string): 'riyadh' | 'eastern' | 'jeddah' {
  if (city === 'الرياض') return 'riyadh'
  if (city === 'الشرقية') return 'eastern'
  return 'jeddah'
}

const categoryColors: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  'صحة': 'success',
  'بيئة': 'success',
  'مجتمع': 'info',
  'وطني': 'warning',
  'ثقافة': 'info',
  'شباب': 'info',
  'تعليم': 'info',
  'سلامة': 'neutral',
}

function SocialIcon({ type }: { type: string }) {
  if (type === 'email') return <Mail size={20} />
  if (type === 'website') return <Globe size={20} />
  if (type === 'twitter') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
  if (type === 'instagram') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
  if (type === 'whatsapp') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
  if (type === 'tiktok') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.82 1.55V6.8a4.85 4.85 0 01-1.05-.11z"/>
    </svg>
  )
  if (type === 'snapchat') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.17 1.5c2.79 0 5.42 2.28 5.42 5.39v.41c0 .58.05 1.41.27 2.52.5.11 1.01.14 1.43.06.33-.07.66.13.72.46.06.33-.13.66-.46.72-.36.07-.9.09-1.51-.03.15.28.31.55.48.82.26.41.21.95-.11 1.3-.3.32-.76.44-1.2.31-.59-.18-1.17-.27-1.72-.27-.56 0-.96.2-1.36.44-.43.26-.88.53-1.63.53-.75 0-1.2-.27-1.63-.53-.4-.24-.8-.44-1.36-.44-.55 0-1.13.09-1.72.27-.44.13-.9.01-1.2-.31-.32-.35-.37-.89-.11-1.3.17-.27.33-.54.48-.82-.61.12-1.15.1-1.51.03-.33-.06-.52-.39-.46-.72.06-.33.39-.53.72-.46.42.08.93.05 1.43-.06.22-1.11.27-1.94.27-2.52v-.41C6.42 3.78 9.38 1.5 12.17 1.5z"/>
    </svg>
  )
  return <ExternalLink size={20} />
}

function statusVariant(status: string): 'success' | 'info' | 'neutral' {
  if (status === 'منتهي') return 'neutral'
  if (status === 'قادم') return 'info'
  return 'success'
}

export default function DashboardPage() {
  const isMobile = useIsMobile()
  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle="مرحباً بك في المركز الإعلامي — F20 Event"
      />

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard value={10} label="فعالية قادمة في المملكة" icon={CalendarDays} />
          <StatCard value={3} label="أيام دولية هذا الشهر" icon={Globe} />
          <StatCard value={3} label="معارض مسجّلة" icon={Building2} />
          <StatCard value={12} label="موظف في الفريق" icon={Users} />
        </div>

        {/* Two column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '60% 40%', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KSA Events */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>أحدث فعاليات المملكة</h2>
                <Link href="/events" style={{ fontSize: '13px', color: 'var(--gold-dark)', fontWeight: 500 }}>عرض الكل</Link>
              </div>
              {upcomingEvents.map((event, idx) => (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: idx < upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatArabicDate(event.dateStart)}</div>
                  </div>
                  <div style={{ marginRight: '12px' }}>
                    <Badge text={event.city} variant={cityVariant(event.city)} />
                  </div>
                </div>
              ))}
            </div>

            {/* World Days */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>الأيام العالمية القادمة</h2>
                <Link href="/world-days" style={{ fontSize: '13px', color: 'var(--gold-dark)', fontWeight: 500 }}>عرض الكل</Link>
              </div>
              {upcomingWorldDays.map((day, idx) => (
                <div
                  key={day.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: idx < upcomingWorldDays.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{day.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatArabicDate(day.date)}</div>
                  </div>
                  <div style={{ marginRight: '12px' }}>
                    <Badge text={day.category} variant={categoryColors[day.category] ?? 'neutral'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Company Events */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>فعاليات الشركة</h2>
                <Link href="/company-events" style={{ fontSize: '13px', color: 'var(--gold-dark)', fontWeight: 500 }}>عرض الكل</Link>
              </div>
              {companyEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{event.client}</div>
                    </div>
                    <Badge text={event.status} variant={statusVariant(event.status)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Reports */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>آخر التقارير</h2>
                <Link href="/reports" style={{ fontSize: '13px', color: 'var(--gold-dark)', fontWeight: 500 }}>عرض الكل</Link>
              </div>
              {reports.slice(0, 3).map((report, idx) => (
                <div
                  key={report.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 0',
                    borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Avatar name={report.employeeName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{report.employeeName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.eventName}</div>
                  </div>
                  <StarRating value={report.programRating} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social accounts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>حسابات التواصل الاجتماعي</h2>
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap' }}>
            {socialAccounts.map((account) => (
              <a
                key={account.id}
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '10px 12px' : '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  minWidth: isMobile ? '64px' : '80px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  textDecoration: 'none',
                }}
              >
                <SocialIcon type={account.type} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {account.platform}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
