'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

type Status = 'checking' | 'ready' | 'invalid'

// Mail security scanners (Microsoft Defender, university quarantine systems,
// and some prefetching clients) visit links found in email bodies before a
// real user clicks them, which burns single-use Supabase invite tokens.
// Fragments (the part after #) are never sent to the server and are not
// read by non-JS scanners, so wrapping the real ConfirmationURL in one here
// keeps it untouched until a genuine browser reads it and the user clicks.
function extractConfirmUrl(hash: string): string | null {
  const prefix = '#confirm='
  if (!hash.startsWith(prefix)) return null

  const raw = hash.slice(prefix.length)
  if (!raw) return null

  const candidates = [raw]
  try {
    const decoded = decodeURIComponent(raw)
    if (decoded !== raw) candidates.push(decoded)
  } catch {
    // raw wasn't percent-encoded (or wasn't validly so) - fall through and
    // try it as-is below.
  }

  let supabaseOrigin: string | null = null
  try {
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  } catch {
    supabaseOrigin = null
  }

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate)
      // Only ever navigate to our own site or our own Supabase project -
      // never an attacker-controlled origin smuggled into the fragment.
      if (parsed.origin === window.location.origin || parsed.origin === supabaseOrigin) {
        return candidate
      }
    } catch {
      continue
    }
  }

  return null
}

export default function SetPasswordStartPage() {
  const t = useTranslations('SetPasswordStart')

  const [status, setStatus] = useState<Status>('checking')
  const [confirmUrl, setConfirmUrl] = useState('')

  useEffect(() => {
    const extracted = extractConfirmUrl(window.location.hash)
    if (extracted) {
      setConfirmUrl(extracted)
      setStatus('ready')
    } else {
      setStatus('invalid')
    }
  }, [])

  const handleContinue = () => {
    if (confirmUrl) window.location.href = confirmUrl
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#E8E8E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Noto Kufi Arabic, sans-serif'
    }}>
      <div style={{
        background: '#2C2C2C',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
          <Image
            src="/f20-logo.png"
            alt="F20 Logo"
            width={785}
            height={624}
            style={{ height: '90px', width: 'auto', marginBottom: '16px' }}
          />
          <p style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: 600, margin: 0, textAlign: 'center' }}>
            {status === 'invalid' ? t('invalidTitle') : t('title')}
          </p>
          <p style={{ color: '#9A9A9A', fontSize: '13px', margin: '6px 0 0 0', textAlign: 'center' }}>
            {status === 'invalid' ? t('invalidMessage') : t('subtitle')}
          </p>
        </div>

        {status === 'checking' && (
          <p style={{ color: '#9A9A9A', fontSize: '13px', textAlign: 'center', margin: 0 }}>
            {t('checkingMessage')}
          </p>
        )}

        {status === 'invalid' && (
          <Link
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              background: '#FFFFFF',
              color: '#2C2C2C',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
          >
            {t('backToLogin')}
          </Link>
        )}

        {status === 'ready' && (
          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '14px',
              background: '#FFFFFF',
              color: '#2C2C2C',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {t('continueButton')}
          </button>
        )}
      </div>
    </div>
  )
}
