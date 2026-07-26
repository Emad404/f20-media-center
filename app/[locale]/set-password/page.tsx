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

    // createBrowserClient (@supabase/ssr) hardcodes flowType: 'pkce', which
    // makes the client's own automatic detectSessionInUrl reject an
    // implicit-grant verify redirect (access_token/refresh_token in the
    // hash, not a PKCE ?code=) as "not a valid PKCE flow url". That error is
    // swallowed internally and never reaches getSession(), which just
    // resolves to a null session forever, so we parse the fragment and
    // establish the session ourselves instead of relying on the built-in
    // detection. This is the shape admin.inviteUserByEmail produces, since
    // it's issued from a plain @supabase/supabase-js service-role client
    // whose flowType defaults to 'implicit'.
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')

    // resetPasswordForEmail, by contrast, is called from THIS page's own
    // browser client (flowType 'pkce'), so Supabase generates a PKCE link
    // instead - it verifies to a ?code= QUERY param, not a hash fragment.
    // That matches this client's own flowType, so detectSessionInUrl
    // exchanges it automatically with no mismatch - getSession() below
    // already picks up the resulting session correctly. The only gap is
    // that arriving via ?code= wasn't being recognized as "fresh auth link"
    // for the ready/redirect decision below, same as the hash-token case.
    const hasPkceCode = new URLSearchParams(window.location.search).has('code')

    // A fresh session established from a fragment token or a PKCE code only
    // ever reaches this page via an invite link or a password-reset link
    // (proxy.ts is the only other way here, and that's cookie-based, no
    // token/code in the URL) - both cases mean "show the set-password form"
    // regardless of the invite-only password_set flag, which a
    // resetting-password employee already has set to true.
    const isTokenSession = Boolean((access_token && refresh_token) || hasPkceCode)

    const evaluate = (session: Session | null) => {
      if (cancelled || !session) return
      if (isTokenSession || session.user.user_metadata?.password_set === false) {
        setStatus('ready')
      } else {
        // Already has a password and got here without a fresh token/code
        // (e.g. proxy.ts's cookie-based redirect) - nothing to do here.
        router.push('/')
      }
    }

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
        window.history.replaceState(window.history.state, '', window.location.pathname)
        evaluate(session)
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => evaluate(session))
    }

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
