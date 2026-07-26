'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'forgot' | 'sent'

export default function LoginPage() {
  const t = useTranslations('Login')
  const tForgot = useTranslations('ForgotPassword')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t('errorMessage'))
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const handleResetSubmit = async () => {
    setResetLoading(true)
    setResetError('')
    // resetPasswordForEmail generates the same implicit-grant style link
    // (#access_token=...) as inviteUserByEmail. redirectTo is where the
    // browser lands AFTER Supabase verifies the real confirmation link with
    // the session tokens attached - matching the invite flow's redirectTo
    // (app/api/employees/invite/route.ts), it points at /set-password, not
    // /set-password/start. The scanner-safe fragment relay (#confirm=...)
    // is produced by the "Reset Password" email template in the Supabase
    // dashboard wrapping { .ConfirmationURL } the same way the "Invite
    // user" template already does - redirectTo can't produce that shape.
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/set-password`,
    })
    setResetLoading(false)
    // Supabase never errors here for a nonexistent email (by design, to
    // avoid account enumeration) - any error surfaced is a real one (rate
    // limit, invalid address), so it's safe to show as-is.
    if (error) {
      setResetError(error.message || tForgot('genericError'))
      return
    }
    setMode('sent')
  }

  const switchToLogin = () => {
    setMode('login')
    setResetEmail('')
    setResetError('')
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
            {mode === 'login' ? t('title') : mode === 'sent' ? tForgot('confirmationTitle') : tForgot('title')}
          </p>
          <p style={{ color: '#9A9A9A', fontSize: '13px', margin: '6px 0 0 0', textAlign: 'center' }}>
            {mode === 'login' ? t('subtitle') : mode === 'sent' ? tForgot('confirmationMessage') : tForgot('subtitle')}
          </p>
        </div>

        {mode === 'login' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            </div>

            {error && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', textAlign: 'center', margin: '12px 0 0 0' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
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
              {loading ? t('loggingIn') : t('loginButton')}
            </button>

            <button
              onClick={() => setMode('forgot')}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#CFCFCF',
                fontSize: '13px',
                textDecoration: 'underline',
                textAlign: 'center',
                margin: '16px 0 0 0',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              {t('forgotPasswordLink')}
            </button>

            <p style={{ color: '#666666', fontSize: '12px', textAlign: 'center', margin: '16px 0 0 0' }}>
              {t('footerNote')}
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
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

            {resetError && (
              <p style={{ color: '#FF6B6B', fontSize: '13px', textAlign: 'center', margin: '12px 0 0 0' }}>
                {resetError}
              </p>
            )}

            <button
              onClick={handleResetSubmit}
              disabled={resetLoading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: resetLoading ? '#CCCCCC' : '#FFFFFF',
                color: '#2C2C2C',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {resetLoading ? tForgot('submitting') : tForgot('submitButton')}
            </button>

            <button
              onClick={switchToLogin}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#CFCFCF',
                fontSize: '13px',
                textDecoration: 'underline',
                textAlign: 'center',
                margin: '16px 0 0 0',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              {tForgot('backToLogin')}
            </button>
          </>
        )}

        {mode === 'sent' && (
          <button
            onClick={switchToLogin}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              marginTop: '20px',
              background: '#FFFFFF',
              color: '#2C2C2C',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tForgot('backToLogin')}
          </button>
        )}
      </div>
    </div>
  )
}
