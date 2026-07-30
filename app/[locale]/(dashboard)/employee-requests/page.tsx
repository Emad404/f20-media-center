'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, X as XIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

const REVIEW_ROLES = ['developer', 'ceo', 'project_manager']
const TYPE_VALUES = ['invoice', 'subscription', 'other'] as const

interface RequestRow {
  id: string
  employee_id: string | null
  type: string | null
  description_ar: string | null
  description_en: string | null
  amount: number | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  requested_at: string
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type RequestForm = {
  type: string
  customType: string
  description_ar: string
  description_en: string
  amount: string
}

const emptyForm: RequestForm = {
  type: 'invoice',
  customType: '',
  description_ar: '',
  description_en: '',
  amount: '',
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

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  display: 'block',
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

export default function EmployeeRequestsPage() {
  const t = useTranslations('EmployeeRequests')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canReview = !!profile && REVIEW_ROLES.includes(profile.role)

  const [requests, setRequests] = useState<RequestRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<RequestRow | null>(null)
  const [form, setForm] = useState<RequestForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [requestsRes, profilesRes] = await Promise.all([
      supabase.from('employee_requests').select('*').order('requested_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name_ar,full_name_en'),
    ])
    setRequests(requestsRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const displayProfileName = (p: ProfileLite | undefined) => {
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const employeeNameFor = (r: RequestRow) => displayProfileName(r.employee_id ? profilesById.get(r.employee_id) : undefined)

  const descriptionFor = (r: RequestRow) => ((locale === 'en' && r.description_en ? r.description_en : r.description_ar) || '')

  const typeLabel = (type: string | null) => {
    if (type === 'invoice') return t('typeInvoice')
    if (type === 'subscription') return t('typeSubscription')
    return type || ''
  }

  const statusLabel = (status: string) => {
    if (status === 'pending') return t('statusPending')
    if (status === 'approved') return t('statusApproved')
    if (status === 'rejected') return t('statusRejected')
    return status
  }

  const myRequests = useMemo(() => {
    if (!profile) return []
    return requests.filter((r) => r.employee_id === profile.id)
  }, [requests, profile])

  const pendingForReview = useMemo(() => {
    return requests.filter((r) => r.status === 'pending')
  }, [requests])

  const openAddModal = () => {
    setEditingRequest(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (r: RequestRow) => {
    setEditingRequest(r)
    const isFixedType = (TYPE_VALUES as readonly string[]).includes(r.type || '')
    setForm({
      type: isFixedType ? (r.type as string) : 'other',
      customType: isFixedType ? '' : (r.type || ''),
      description_ar: r.description_ar || '',
      description_en: r.description_en || '',
      amount: r.amount != null ? String(r.amount) : '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRequest(null)
    setSaveError('')
  }

  const handleSubmit = async () => {
    const resolvedType = form.type === 'other' ? form.customType.trim() : form.type
    if (!resolvedType || !form.description_ar.trim()) {
      setSaveError(t('formErrorMessage'))
      return
    }
    if (!profile) return

    const payload = {
      type: resolvedType,
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim() || null,
      amount: form.amount.trim() ? Number(form.amount) : null,
    }

    setSaving(true)
    setSaveError('')
    const { error } = editingRequest
      ? await supabase.from('employee_requests').update(payload).eq('id', editingRequest.id)
      : await supabase.from('employee_requests').insert({ ...payload, employee_id: profile.id })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchAll()
    flashSuccess(editingRequest ? t('editSuccess') : t('submitSuccess'))
  }

  const handleDelete = async (r: RequestRow) => {
    if (!window.confirm(t('deleteConfirm'))) return
    const { error } = await supabase.from('employee_requests').delete().eq('id', r.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const handleReview = async (request: RequestRow, newStatus: 'approved' | 'rejected') => {
    if (!profile) return
    setActioningId(request.id)
    const { error } = await supabase
      .from('employee_requests')
      .update({ status: newStatus, reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
      .eq('id', request.id)
    setActioningId(null)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(newStatus === 'approved' ? t('approveSuccess') : t('rejectSuccess'))
  }

  const addButton = (
    <button
      onClick={openAddModal}
      style={{
        background: 'var(--btn-bg)',
        color: 'var(--btn-text)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {t('addButton')}
    </button>
  )

  return (
    <div>
      <PageHeader title={t('pageTitle')} subtitle={t('subtitle')} />

      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {addButton}
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: isRtl ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {successMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            fontSize: '13px',
          }}>
            {successMessage}
          </div>
        )}

        {canReview && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', marginBottom: '14px' }}>
              {t('pendingReviewTitle')}
            </h2>
            {loading ? (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
            ) : pendingForReview.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('noPendingMessage')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingForReview.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={employeeNameFor(r) || '?'} size="sm" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{employeeNameFor(r) || '—'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatArabicDate(r.requested_at, locale)}</div>
                        </div>
                      </div>
                      <Badge text={typeLabel(r.type)} variant="info" />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{descriptionFor(r)}</div>
                    {r.amount != null && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('amountLabel')}: {r.amount}</div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleReview(r, 'approved')}
                        disabled={actioningId === r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: 'var(--success-bg)', color: 'var(--success-text)',
                          border: 'none', borderRadius: '8px', padding: '8px 14px',
                          fontSize: '13px', fontWeight: 500, cursor: actioningId === r.id ? 'not-allowed' : 'pointer',
                          opacity: actioningId === r.id ? 0.6 : 1,
                        }}
                      >
                        <Check size={14} /> {t('approveButton')}
                      </button>
                      <button
                        onClick={() => handleReview(r, 'rejected')}
                        disabled={actioningId === r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: 'var(--danger-bg)', color: 'var(--danger-text)',
                          border: 'none', borderRadius: '8px', padding: '8px 14px',
                          fontSize: '13px', fontWeight: 500, cursor: actioningId === r.id ? 'not-allowed' : 'pointer',
                          opacity: actioningId === r.id ? 0.6 : 1,
                        }}
                      >
                        <XIcon size={14} /> {t('rejectButton')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', marginBottom: '14px' }}>
            {t('myRequestsTitle')}
          </h2>
          {loading ? (
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
          ) : myRequests.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('emptyState')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myRequests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge text={typeLabel(r.type)} variant="info" />
                      <Badge text={statusLabel(r.status)} variant={statusVariant(r.status)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatArabicDate(r.requested_at, locale)}</div>
                      {r.status === 'pending' && (
                        <PersonCardMenu
                          isRtl={isRtl}
                          optionsAria={t('optionsAria')}
                          editLabel={t('editAria')}
                          deleteLabel={t('deleteAria')}
                          onEdit={() => openEditModal(r)}
                          onDelete={() => handleDelete(r)}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{descriptionFor(r)}</div>
                  {r.amount != null && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('amountLabel')}: {r.amount}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRequest ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('typeLabel')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {TYPE_VALUES.map((tv) => (
                <option key={tv} value={tv}>{tv === 'other' ? t('typeOther') : typeLabel(tv)}</option>
              ))}
            </select>
          </div>

          {form.type === 'other' && (
            <div>
              <label style={labelStyle}>{t('customTypeLabel')}</label>
              <input
                dir={isRtl ? 'rtl' : 'ltr'}
                value={form.customType}
                onChange={(e) => setForm((f) => ({ ...f, customType: e.target.value }))}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('descriptionArLabel')}</label>
            <textarea
              dir="rtl"
              value={form.description_ar}
              onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>{t('descriptionEnLabel')}</label>
            <textarea
              dir="ltr"
              value={form.description_en}
              onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('amountLabel')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {saveError && (
            <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{saveError}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t('saving') : editingRequest ? t('saveButtonEdit') : t('saveButton')}
            </button>
            <button
              onClick={closeModal}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
