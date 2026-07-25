'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type Status = 'checking' | 'ready' | 'invalid'

export default function SetPasswordPage() {
  const t = useTranslations('SetPassword')
  const supabase = createClient()
  const router = useRouter()

  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The invite link's session tokens arrive as a URL fragment, which the
    // server never sees - proxy.ts can only see whatever cookie session
    // already existed in this browser (e.g. an admin's own, if they're
    // testing from the same browser they sent the invite from). So this
    // page - client-side, after the browser client has parsed the fragment
    // and settled on whichever session actually won - is what decides
    // whether a password still needs to be set, not the server.
    let cancelled = false

    const evaluate = (session: Session | null) => {
      if (cancelled || !session) return
      if (session.user.user_metadata?.password_set === false) {
        setStatus('ready')
      } else {
        // Already has a password (or this session was never an invite to
        // begin with) - nothing to do here.
        router.push('/')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => evaluate(session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session)
    })

    const timeout = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === 'checking' ? 'invalid' : s))
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError(t('tooShortError'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('mismatchError'))
      return
    }

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    })

    if (updateError) {
      setError(updateError.message || t('genericError'))
      setLoading(false)
      return
    }

    router.push('/')
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
            width={90}
            height={90}
            style={{ marginBottom: '16px' }}
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
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '8px',
                  border: '1px solid #444444',
                  background: '#3A3A3A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '8px',
                  border: '1px solid #444444',
                  background: '#3A3A3A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', textAlign: 'center', margin: '12px 0 0 0' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: loading ? '#CCCCCC' : '#FFFFFF',
                color: '#2C2C2C',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {loading ? t('submitting') : t('submitButton')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
