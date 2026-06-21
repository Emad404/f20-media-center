import PageHeader from '@/components/PageHeader'
import { socialAccounts } from '@/data/social'
import { Mail, Globe } from 'lucide-react'

function SocialIcon({ type }: { type: string }) {
  if (type === 'email') return <Mail size={24} />
  if (type === 'website') return <Globe size={24} />
  if (type === 'twitter') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
  if (type === 'instagram') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
  if (type === 'whatsapp') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
  if (type === 'tiktok') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.82 1.55V6.8a4.85 4.85 0 01-1.05-.11z" />
    </svg>
  )
  if (type === 'snapchat') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12.17 1.5c2.79 0 5.42 2.28 5.42 5.39v.41c0 .58.05 1.41.27 2.52.5.11 1.01.14 1.43.06.33-.07.66.13.72.46.06.33-.13.66-.46.72-.36.07-.9.09-1.51-.03.15.28.31.55.48.82.26.41.21.95-.11 1.3-.3.32-.76.44-1.2.31-.59-.18-1.17-.27-1.72-.27-.56 0-.96.2-1.36.44-.43.26-.88.53-1.63.53-.75 0-1.2-.27-1.63-.53-.4-.24-.8-.44-1.36-.44-.55 0-1.13.09-1.72.27-.44.13-.9.01-1.2-.31-.32-.35-.37-.89-.11-1.3.17-.27.33-.54.48-.82-.61.12-1.15.1-1.51.03-.33-.06-.52-.39-.46-.72.06-.33.39-.53.72-.46.42.08.93.05 1.43-.06.22-1.11.27-1.94.27-2.52v-.41C6.42 3.78 9.38 1.5 12.17 1.5z" />
    </svg>
  )
  return <Globe size={24} />
}

export default function SocialPage() {
  return (
    <div>
      <PageHeader
        title="حسابات التواصل الاجتماعي"
        subtitle="قنوات التواصل الرسمية لـ F20 Event"
      />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {socialAccounts.map((account) => (
            <div
              key={account.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>
                <SocialIcon type={account.type} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {account.platform}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-geist-sans, monospace)',
                    marginBottom: '8px',
                  }}
                >
                  {account.handle}
                </div>
              </div>
              <a
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: 'var(--gold)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  marginTop: 'auto',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {account.type === 'email' ? 'فتح البريد' : account.type === 'website' ? 'فتح الموقع' : 'فتح الحساب'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
