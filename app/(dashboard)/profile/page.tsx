'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useUserProfile } from '@/lib/context/UserProfileContext'

function getInitials(name: string): string {
  const words = (name || '').trim().split(/\s+/)
  if (words.length === 0 || words[0] === '') return '؟'
  if (words.length === 1) return words[0].slice(0, 2)
  return words[0][0] + words[words.length - 1][0]
}

export default function ProfilePage() {
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile, loading, refreshProfile } = useUserProfile()

  const [form, setForm] = useState({ full_name_ar: '', full_name_en: '', phone: '' })
  const formInitialized = useRef(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    if (profile && !formInitialized.current) {
      setForm({
        full_name_ar: profile.full_name_ar || '',
        full_name_en: profile.full_name_en || '',
        phone: profile.phone || '',
      })
      formInitialized.current = true
    }
  }, [profile])

  const hasChanges =
    !!profile &&
    (form.full_name_ar !== (profile.full_name_ar || '') ||
      form.full_name_en !== (profile.full_name_en || '') ||
      form.phone !== (profile.phone || ''))

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setStatus('idle')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name_ar: form.full_name_ar,
        full_name_en: form.full_name_en,
        phone: form.phone,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      setStatus('error')
    } else {
      await refreshProfile()
      setStatus('success')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setPhotoError('')

    if (!file.type.startsWith('image/')) {
      setPhotoError('يرجى اختيار ملف صورة صحيح')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('يجب أن تكون الصورة أقل من 2 ميجابايت')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    const path = `${profile.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
    if (uploadError) {
      setPhotoError(uploadError.message)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: urlData.publicUrl })
      .eq('id', profile.id)

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (updateError) {
      setPhotoError(updateError.message)
      return
    }

    await refreshProfile()
  }

  const handleRemovePhoto = async () => {
    if (!profile?.profile_image_url) return

    setPhotoError('')
    setRemovingPhoto(true)

    const marker = '/avatars/'
    const markerIndex = profile.profile_image_url.indexOf(marker)
    const storagePath = markerIndex >= 0 ? profile.profile_image_url.slice(markerIndex + marker.length) : null

    if (storagePath) {
      const { error: removeError } = await supabase.storage.from('avatars').remove([storagePath])
      if (removeError) {
        setPhotoError(removeError.message)
        setRemovingPhoto(false)
        return
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: null })
      .eq('id', profile.id)

    setRemovingPhoto(false)
    if (updateError) {
      setPhotoError(updateError.message)
      return
    }

    await refreshProfile()
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  }

  const readOnlyStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'var(--neutral-bg)',
    cursor: 'not-allowed',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  return (
    <div>
      <PageHeader title="الملف الشخصي" />

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>جارٍ التحميل...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
            {/* Left column */}
            <div
              style={{
                width: isMobile ? '100%' : '280px',
                flexShrink: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
                <img
                  src={profile?.profile_image_url || '/employee_placeholder.png'}
                  alt={profile?.full_name_ar}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="تغيير الصورة"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    border: '2px solid var(--bg-card)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {uploading && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                  جارٍ الرفع...
                </div>
              )}
              {photoError && (
                <div style={{ fontSize: '12px', color: 'var(--danger-text)', marginTop: '10px' }}>
                  {photoError}
                </div>
              )}
              {profile?.profile_image_url && !uploading && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={removingPhoto}
                  style={{
                    display: 'block',
                    margin: '10px auto 0',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: 'var(--danger-text)',
                    textDecoration: 'underline',
                    cursor: removingPhoto ? 'not-allowed' : 'pointer',
                  }}
                >
                  {removingPhoto ? 'جارٍ الإزالة...' : 'إزالة الصورة'}
                </button>
              )}

              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
                {profile?.full_name_ar}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {profile?.job_title_ar}
              </div>

              {profile?.department_ar && (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <Badge text={profile.department_ar} variant="neutral" />
                </div>
              )}
            </div>

            {/* Right column */}
            <div
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                padding: '24px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                معلومات المستخدم
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={labelStyle}>الاسم الكامل (عربي)</div>
                  <input
                    dir="rtl"
                    value={form.full_name_ar}
                    onChange={(e) => setForm((f) => ({ ...f, full_name_ar: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={labelStyle}>Full Name (English)</div>
                  <input
                    dir="ltr"
                    value={form.full_name_en}
                    onChange={(e) => setForm((f) => ({ ...f, full_name_en: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={labelStyle}>رقم الهاتف</div>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={labelStyle}>
                    البريد الإلكتروني
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(لا يمكن تعديله)</span>
                  </div>
                  <input value={profile?.email || ''} disabled style={readOnlyStyle} />
                </div>

                <div>
                  <div style={labelStyle}>
                    المسمى الوظيفي
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(لا يمكن تعديله)</span>
                  </div>
                  <input value={profile?.job_title_ar || ''} disabled style={readOnlyStyle} />
                </div>

                <div>
                  <div style={labelStyle}>
                    القسم
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(لا يمكن تعديله)</span>
                  </div>
                  <input value={profile?.department_ar || ''} disabled style={readOnlyStyle} />
                </div>

                <div>
                  <div style={labelStyle}>
                    الصلاحية
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(لا يمكن تعديله)</span>
                  </div>
                  <input value={profile?.role || ''} disabled style={readOnlyStyle} />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  style={{
                    background: hasChanges && !saving ? 'var(--gold)' : 'var(--border-strong)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: hasChanges && !saving ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>

                {status === 'success' && (
                  <span style={{ fontSize: '13px', color: 'var(--success-text)' }}>تم الحفظ بنجاح</span>
                )}
                {status === 'error' && (
                  <span style={{ fontSize: '13px', color: 'var(--danger-text)' }}>حدث خطأ أثناء الحفظ</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
