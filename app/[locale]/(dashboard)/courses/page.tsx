'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Clock, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatDateRange } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

const ALL = '__all__'
const MANAGE_ROLES = ['developer', 'ceo', 'project_manager']
const TYPE_VALUES = ['course', 'workshop', 'certification'] as const
const STATUS_VALUES = ['available', 'upcoming', 'closed'] as const
const SOURCE_VALUES = ['internal', 'external'] as const

interface CourseRow {
  id: string
  title_ar: string
  title_en: string | null
  provider_ar: string | null
  provider_en: string | null
  url: string | null
  type: string | null
  duration_hours: number | null
  start_date: string | null
  end_date: string | null
  status: string | null
  source: string | null
}

type CourseForm = {
  title_ar: string
  title_en: string
  provider_ar: string
  provider_en: string
  url: string
  type: string
  duration_hours: number
  start_date: string
  end_date: string
  status: string
  source: string
}

const emptyForm: CourseForm = {
  title_ar: '',
  title_en: '',
  provider_ar: '',
  provider_en: '',
  url: '',
  type: 'course',
  duration_hours: 1,
  start_date: '',
  end_date: '',
  status: 'available',
  source: 'external',
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

export default function CoursesPage() {
  const t = useTranslations('Courses')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && MANAGE_ROLES.includes(profile.role)

  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState(ALL)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null)
  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').order('start_date', { ascending: false, nullsFirst: false })
    setCourses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const displayTitle = (c: CourseRow) => (locale === 'en' && c.title_en ? c.title_en : c.title_ar)
  const displayProvider = (c: CourseRow) => ((locale === 'en' && c.provider_en ? c.provider_en : c.provider_ar) || '')

  const typeLabel = (type: string | null) => {
    if (type === 'course') return t('typeCourse')
    if (type === 'workshop') return t('typeWorkshop')
    if (type === 'certification') return t('typeCertification')
    return type || ''
  }
  const statusLabel = (status: string | null) => {
    if (status === 'available') return t('statusAvailable')
    if (status === 'upcoming') return t('statusUpcoming')
    if (status === 'closed') return t('statusClosed')
    return status || ''
  }
  const sourceLabel = (source: string | null) => {
    if (source === 'internal') return t('sourceInternal')
    if (source === 'external') return t('sourceExternal')
    return source || ''
  }

  const types = useMemo(() => [ALL, ...TYPE_VALUES], [])

  const filtered = useMemo(() => {
    return courses.filter((c) => typeFilter === ALL || c.type === typeFilter)
  }, [courses, typeFilter])

  const openAddModal = () => {
    setEditingCourse(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (c: CourseRow) => {
    setEditingCourse(c)
    setForm({
      title_ar: c.title_ar || '',
      title_en: c.title_en || '',
      provider_ar: c.provider_ar || '',
      provider_en: c.provider_en || '',
      url: c.url || '',
      type: c.type || 'course',
      duration_hours: c.duration_hours ?? 1,
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      status: c.status || 'available',
      source: c.source || 'external',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.title_ar.trim()) {
      setSaveError(t('titleArRequiredError'))
      return
    }

    const payload = {
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim() || null,
      provider_ar: form.provider_ar.trim() || null,
      provider_en: form.provider_en.trim() || null,
      url: form.url.trim() || null,
      type: form.type,
      duration_hours: form.duration_hours || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      source: form.source,
    }

    setSaving(true)
    setSaveError('')

    const { error } = editingCourse
      ? await supabase.from('courses').update(payload).eq('id', editingCourse.id)
      : await supabase.from('courses').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchCourses()
    flashSuccess(editingCourse ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (c: CourseRow) => {
    if (!window.confirm(t('deleteConfirm', { title: displayTitle(c) }))) return
    const { error } = await supabase.from('courses').delete().eq('id', c.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchCourses()
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
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: '1px solid',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: typeFilter === type ? 'var(--btn-bg)' : 'transparent',
              borderColor: typeFilter === type ? 'var(--btn-bg)' : 'var(--border-strong)',
              color: typeFilter === type ? 'var(--btn-text)' : 'var(--text-secondary)',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {type === ALL ? t('allOption') : typeLabel(type)}
          </button>
        ))}
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
            {filtered.map((course) => (
              <div
                key={course.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Top row: badges + menu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {course.type && <Badge text={typeLabel(course.type)} variant="neutral" />}
                    {course.status && <Badge text={statusLabel(course.status)} variant={course.status === 'available' ? 'success' : course.status === 'upcoming' ? 'gold' : 'neutral'} />}
                    {course.source && <Badge text={sourceLabel(course.source)} variant="info" />}
                  </div>
                  {canManage && (
                    <PersonCardMenu
                      isRtl={isRtl}
                      optionsAria={t('optionsAria')}
                      editLabel={t('editAria')}
                      deleteLabel={t('deleteAria')}
                      onEdit={() => openEditModal(course)}
                      onDelete={() => handleDelete(course)}
                    />
                  )}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {displayTitle(course)}
                </h3>

                {/* Provider */}
                {displayProvider(course) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <ExternalLink size={12} />
                    <span>{displayProvider(course)}</span>
                  </div>
                )}

                {/* Duration + dates */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {!!course.duration_hours && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Clock size={13} />
                      <span>{t('hoursValue', { hours: course.duration_hours })}</span>
                    </div>
                  )}
                  {course.start_date && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {formatDateRange(course.start_date, course.end_date || course.start_date, locale)}
                    </div>
                  )}
                </div>

                {/* Open course */}
                {course.url && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--btn-bg)',
                        color: 'var(--btn-text)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {t('openCourseButton')}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
            {courses.length === 0 ? t('emptyState') : t('noCoursesMessage')}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCourse ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('titleArLabel')}</label>
            <input dir="rtl" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>{t('titleEnLabel')}</label>
            <input dir="ltr" value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('providerArLabel')}</label>
            <input dir="rtl" value={form.provider_ar} onChange={(e) => setForm((f) => ({ ...f, provider_ar: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('providerEnLabel')}</label>
            <input dir="ltr" value={form.provider_en} onChange={(e) => setForm((f) => ({ ...f, provider_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('urlLabel')}</label>
            <input dir="ltr" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{t('typeFieldLabel')}</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {TYPE_VALUES.map((tv) => <option key={tv} value={tv}>{typeLabel(tv)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('durationHoursLabel')}</label>
              <input type="number" min="0" value={form.duration_hours} onChange={(e) => setForm((f) => ({ ...f, duration_hours: Number(e.target.value) }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('startDateLabel')}</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('endDateLabel')}</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{t('statusFieldLabel')}</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('sourceFieldLabel')}</label>
              <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {SOURCE_VALUES.map((s) => <option key={s} value={s}>{sourceLabel(s)}</option>)}
              </select>
            </div>
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
              {saving ? t('saving') : editingCourse ? t('saveButtonEdit') : t('saveButton')}
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
