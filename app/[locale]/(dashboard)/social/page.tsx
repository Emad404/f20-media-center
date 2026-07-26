'use client'

import { useLocale, useTranslations } from 'next-intl'
import PageHeader from '@/components/PageHeader'
import { socialAccounts } from '@/data/social'
import { Mail, Globe } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

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
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  )
  return <Globe size={24} />
}

export default function SocialPage() {
  const t = useTranslations('Social')
  const isRtl = useLocale() === 'ar'
  const isMobile = useIsMobile()
  return (
    <div>
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {socialAccounts.map((account) => {
            const displayName = !isRtl && account.name_en ? account.name_en : account.name_ar
            return (
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
                aspectRatio: '1 / 1',
              }}
            >
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, alignSelf: 'center' }}>
                <SocialIcon type={account.type} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {displayName}
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
                  background: 'var(--btn-bg)',
                  color: 'var(--btn-text)',
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
                {account.type === 'email' ? t('openEmailButton') : account.type === 'website' ? t('openWebsiteButton') : t('openAccountButton')}
              </a>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
