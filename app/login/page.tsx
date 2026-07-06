'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#E8E8E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Noto Kufi Arabic, sans-serif',
      direction: 'rtl'
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
            F - Twenty Event Management
          </p>
          <p style={{ color: '#9A9A9A', fontSize: '13px', margin: '6px 0 0 0', textAlign: 'center' }}>
            المركز الإعلامي
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="rtl"
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
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="rtl"
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
          {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>

        <p style={{ color: '#666666', fontSize: '12px', textAlign: 'center', margin: '16px 0 0 0' }}>
          للوصول إلى النظام يجب أن يكون لديك حساب مفعّل
        </p>
      </div>
    </div>
  )
}
