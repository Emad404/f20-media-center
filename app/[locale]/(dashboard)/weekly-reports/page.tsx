'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import PageHeader from '@/components/PageHeader'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

const ALL = '__all__'
const MANAGE_ROLES = ['developer', 'ceo', 'project_manager', 'PR_manager', 'media_manager', 'Trainee']

interface WeeklyReportRow {
  id: string
  employee_id: string | null
  tasks_performed_ar: string | null
  tasks_performed_en: string | null
  week_start_date: string | null
  created_at: string
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type WeeklyReportForm = {
  tasks_performed_ar: string
  tasks_performed_en: string
  week_start_date: string
}

const emptyForm: WeeklyReportForm = {
  tasks_performed_ar: '',
  tasks_performed_en: '',
  week_start_date: '',
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

export default function WeeklyReportsPage() {
  const t = useTranslations('WeeklyReports')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && MANAGE_ROLES.includes(profile.role)

  const [reports, setReports] = useState<WeeklyReportRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState(ALL)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<WeeklyReportRow | null>(null)
  const [form, setForm] = useState<WeeklyReportForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [reportsRes, profilesRes] = await Promise.all([
      supabase.from('weekly_reports').select('*').order('week_start_date', { ascending: false }),
      supabase.from('profiles').select('id,full_name_ar,full_name_en'),
    ])
    setReports(reportsRes.data || [])
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

  const employeeNameFor = (r: WeeklyReportRow) => displayProfileName(r.employee_id ? profilesById.get(r.employee_id) : undefined)

  const tasksFor = (r: WeeklyReportRow) => ((locale === 'en' && r.tasks_performed_en ? r.tasks_performed_en : r.tasks_performed_ar) || '')

  const employeeOptions = useMemo(() => {
    const ids = Array.from(new Set(reports.map((r) => r.employee_id).filter((id): id is string => !!id)))
    return [ALL, ...ids]
  }, [reports])

  const filtered = useMemo(() => {
    return reports.filter((r) => employeeFilter === ALL || r.employee_id === employeeFilter)
  }, [reports, employeeFilter])

  const openAddModal = () => {
    setEditingReport(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (r: WeeklyReportRow) => {
    setEditingReport(r)
    setForm({
      tasks_performed_ar: r.tasks_performed_ar || '',
      tasks_performed_en: r.tasks_performed_en || '',
      week_start_date: r.week_start_date || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingReport(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.tasks_performed_ar.trim() || !form.week_start_date) {
      setSaveError(t('formErrorMessage'))
      return
    }

    const payload = {
      employee_id: editingReport ? editingReport.employee_id : profile?.id || null,
      tasks_performed_ar: form.tasks_performed_ar.trim(),
      tasks_performed_en: form.tasks_performed_en.trim() || null,
      week_start_date: form.week_start_date,
    }

    setSaving(true)
    setSaveError('')

    const { error } = editingReport
      ? await supabase.from('weekly_reports').update(payload).eq('id', editingReport.id)
      : await supabase.from('weekly_reports').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchAll()
    flashSuccess(editingReport ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (r: WeeklyReportRow) => {
    if (!window.confirm(t('deleteConfirm', { name: employeeNameFor(r) || t('untitledReport') }))) return
    const { error } = await supabase.from('weekly_reports').delete().eq('id', r.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const addButton = canManage ? (
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
  ) : null

  return (
    <div>
      <PageHeader title={t('pageTitle')} subtitle={t('subtitle')} />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
        >
          {employeeOptions.map((id) => (
            <option key={id} value={id}>
              {id === ALL ? t('allOption') : displayProfileName(profilesById.get(id))}
            </option>
          ))}
        </select>
        {addButton && (
          <div style={{ marginInlineStart: isMobile ? 0 : 'auto', display: 'flex', gap: '10px' }}>
            {addButton}
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {successMessage && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            fontSize: '13px',
          }}>
            {successMessage}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((report) => (
              <div
                key={report.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={employeeNameFor(report) || '?'} size="md" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {employeeNameFor(report) || '—'}
                      </div>
                      {report.week_start_date && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {t('weekOfLabel', { date: formatArabicDate(report.week_start_date) })}
                        </div>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <PersonCardMenu
                      isRtl={isRtl}
                      optionsAria={t('optionsAria')}
                      editLabel={t('editAria')}
                      deleteLabel={t('deleteAria')}
                      onEdit={() => openEditModal(report)}
                      onDelete={() => handleDelete(report)}
                    />
                  )}
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {tasksFor(report)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
            {reports.length === 0 ? t('emptyState') : t('noResultsMessage')}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingReport ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('weekStartDateLabel')}</label>
            <input
              type="date"
              value={form.week_start_date}
              onChange={(e) => setForm((f) => ({ ...f, week_start_date: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>{t('tasksPerformedArLabel')}</label>
            <textarea
              dir="rtl"
              value={form.tasks_performed_ar}
              onChange={(e) => setForm((f) => ({ ...f, tasks_performed_ar: e.target.value }))}
              style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>{t('tasksPerformedEnLabel')}</label>
            <textarea
              dir="ltr"
              value={form.tasks_performed_en}
              onChange={(e) => setForm((f) => ({ ...f, tasks_performed_en: e.target.value }))}
              style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
            />
          </div>

          {saveError && (
            <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{saveError}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSave}
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
              {saving ? t('saving') : editingReport ? t('saveButtonEdit') : t('saveButton')}
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
