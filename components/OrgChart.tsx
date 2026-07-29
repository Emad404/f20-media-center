'use client'

import { useLocale } from 'next-intl'
import Avatar from '@/components/Avatar'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Member {
  nameAr: string
  nameEn: string
}

interface DepartmentNode {
  titleAr: string
  titleEn: string
  members: Member[]
}

const CHAIRMAN = { titleAr: 'رئيس مجلس الإدارة', titleEn: 'Chairman of the Board' }
const CEO = { titleAr: 'الرئيس التنفيذي', titleEn: 'Chief Executive Officer' }

// Order is the target left-to-right sequence in both locales - the desktop
// row below forces `direction: ltr` so this DOM order always maps directly
// to screen position, regardless of the active locale's reading direction.
const DEPARTMENTS: DepartmentNode[] = [
  { titleAr: 'مدير إدارة المشاريع', titleEn: 'Project Management Director', members: [{ nameAr: 'رانيا الجعيد', nameEn: 'Ranya Aljuaid' }] },
  { titleAr: 'العلاقات العامة', titleEn: 'Public Relations', members: [{ nameAr: 'روان الجعيد', nameEn: 'Rawan Aljuaid' }] },
  { titleAr: 'الموارد البشرية', titleEn: 'Human Resources', members: [{ nameAr: 'الهنوف القرناس', nameEn: 'AlHanouf Alqarnas' }, { nameAr: 'شادن العيد', nameEn: 'Shaden Aleid' }] },
  { titleAr: 'فعاليات رياضية', titleEn: 'Sports Events', members: [{ nameAr: 'خلود النصار', nameEn: 'Kholoud Alnassar' }] },
  { titleAr: 'تقنية المعلومات والدعم الفني', titleEn: 'IT & Technical Support', members: [{ nameAr: 'عماد العسكر', nameEn: 'Emad Alaskar' }] },
  { titleAr: 'خدمة العملاء', titleEn: 'Customer Service', members: [{ nameAr: 'روان الجعيد', nameEn: 'Rawan Aljuaid' }] },
  { titleAr: 'اعلام واتصال', titleEn: 'Media & Communication', members: [{ nameAr: 'تركي النصار', nameEn: 'Turki Alnassar' }] },
]

function VLine({ height }: { height: number }) {
  return <div style={{ width: '2px', height: `${height}px`, background: 'var(--border-strong)' }} />
}

function TitleCard({ title, tier }: { title: string; tier: 'top' | 'department' }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${tier === 'top' ? 'var(--gold)' : 'var(--navy)'}`,
        borderRadius: '12px',
        padding: tier === 'top' ? '14px 22px' : '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        textAlign: 'center',
        minWidth: tier === 'top' ? '220px' : '150px',
      }}
    >
      <div
        style={{
          fontSize: tier === 'top' ? '15px' : '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
    </div>
  )
}

function MemberCard({ name, locale }: { name: Member; locale: string }) {
  const displayName = locale === 'en' ? name.nameEn : name.nameAr
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        minWidth: '130px',
      }}
    >
      <Avatar name={displayName} size="sm" />
      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3 }}>
        {displayName}
      </div>
    </div>
  )
}

export default function OrgChart() {
  const locale = useLocale()
  const isMobile = useIsMobile()
  const deptTitle = (d: DepartmentNode) => (locale === 'en' ? d.titleEn : d.titleAr)

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
        <TitleCard title={locale === 'en' ? CHAIRMAN.titleEn : CHAIRMAN.titleAr} tier="top" />
        <VLine height={16} />
        <TitleCard title={locale === 'en' ? CEO.titleEn : CEO.titleAr} tier="top" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '8px' }}>
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.titleAr}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-page)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <TitleCard title={deptTitle(dept)} tier="department" />
              {dept.members.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                  {dept.members.map((m) => <MemberCard key={m.nameAr} name={m} locale={locale} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 32px', overflowX: 'auto' }}>
      <TitleCard title={locale === 'en' ? CHAIRMAN.titleEn : CHAIRMAN.titleAr} tier="top" />
      <VLine height={24} />
      <TitleCard title={locale === 'en' ? CEO.titleEn : CEO.titleAr} tier="top" />
      <VLine height={24} />

      {/* direction is forced to ltr regardless of locale so the department
          order below always maps directly to left-to-right screen position -
          without this, the same DOM order would visually mirror between
          locales since flex row direction follows document direction. */}
      <div style={{ display: 'flex', direction: 'ltr', justifyContent: 'center', gap: '18px', minWidth: 'fit-content', padding: '0 8px' }}>
        {DEPARTMENTS.map((dept) => (
          <div
            key={dept.titleAr}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderTop: '2px solid var(--border-strong)',
              paddingTop: '20px',
              width: '160px',
              flexShrink: 0,
            }}
          >
            <TitleCard title={deptTitle(dept)} tier="department" />
            {dept.members.length > 0 && (
              <>
                <VLine height={16} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  {dept.members.map((m) => <MemberCard key={m.nameAr} name={m} locale={locale} />)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
