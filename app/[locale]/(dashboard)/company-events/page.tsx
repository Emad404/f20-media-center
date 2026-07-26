'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, MapPin, CalendarDays, FileSpreadsheet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { formatDateRange } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { exportToExcel } from '@/lib/exportXlsx'

const ALL = '__all__'
const STATUS_VALUES = ['upcoming', 'ongoing', 'finished'] as const

interface CompanyEventRow {
  id: string
  title_ar: string
  title_en: string | null
  client_name_ar: string | null
  client_name_en: string | null
  location_ar: string | null
  location_en: string | null
  city: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  notes_ar: string | null
  notes_en: string | null
  created_at: string
}

type CompanyEventForm = {
  title_ar: string
  title_en: string
  client_name_ar: string
  client_name_en: string
  location_ar: string
  location_en: string
  city: string
  start_date: string
  end_date: string
  status: string
  notes_ar: string
  notes_en: string
}

const emptyForm: CompanyEventForm = {
  title_ar: '',
  title_en: '',
  client_name_ar: '',
  client_name_en: '',
  location_ar: '',
  location_en: '',
  city: '',
  start_date: '',
  end_date: '',
  status: 'upcoming',
  notes_ar: '',
  notes_en: '',
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

function StatusBadge({ status, label }: { status: string | null; label: string }) {
  if (status === 'upcoming') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--gold-light)', color: 'var(--gold-dark)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    )
  }
  if (status === 'ongoing') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--success-bg)', color: 'var(--success-text)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-text)', display: 'inline-block', marginInlineEnd: 6 }} />
        {label}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: 'var(--neutral-bg)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export default function CompanyEventsPage() {
  const t = useTranslations('CompanyEvents')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()

  const [events, setEvents] = useState<CompanyEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CompanyEventRow | null>(null)
  const [form, setForm] = useState<CompanyEventForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('company_events').select('*').order('start_date', { ascending: true, nullsFirst: false })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const displayTitle = (e: CompanyEventRow) => (locale === 'en' && e.title_en ? e.title_en : e.title_ar)
  const displayClient = (e: CompanyEventRow) => ((locale === 'en' && e.client_name_en ? e.client_name_en : e.client_name_ar) || '')
  const displayLocation = (e: CompanyEventRow) => ((locale === 'en' && e.location_en ? e.location_en : e.location_ar) || '')
  const displayNotes = (e: CompanyEventRow) => ((locale === 'en' && e.notes_en ? e.notes_en : e.notes_ar) || '')

  const statusLabel = (status: string | null) => {
    if (status === 'upcoming') return t('statusUpcoming')
    if (status === 'ongoing') return t('statusOngoing')
    if (status === 'finished') return t('statusFinished')
    return status || ''
  }

  const filtered = useMemo(() => {
    return events.filter((e) => statusFilter === ALL || e.status === statusFilter)
  }, [events, statusFilter])

  const statuses = [ALL, ...STATUS_VALUES]

  const openAddModal = () => {
    setEditingEvent(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (ev: CompanyEventRow) => {
    setEditingEvent(ev)
    setForm({
      title_ar: ev.title_ar || '',
      title_en: ev.title_en || '',
      client_name_ar: ev.client_name_ar || '',
      client_name_en: ev.client_name_en || '',
      location_ar: ev.location_ar || '',
      location_en: ev.location_en || '',
      city: ev.city || '',
      start_date: ev.start_date || '',
      end_date: ev.end_date || '',
      status: ev.status || 'upcoming',
      notes_ar: ev.notes_ar || '',
      notes_en: ev.notes_en || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
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
      client_name_ar: form.client_name_ar.trim() || null,
      client_name_en: form.client_name_en.trim() || null,
      location_ar: form.location_ar.trim() || null,
      location_en: form.location_en.trim() || null,
      city: form.city.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      notes_ar: form.notes_ar.trim() || null,
      notes_en: form.notes_en.trim() || null,
    }

    setSaving(true)
    setSaveError('')

    const { error } = editingEvent
      ? await supabase.from('company_events').update(payload).eq('id', editingEvent.id)
      : await supabase.from('company_events').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchEvents()
    flashSuccess(editingEvent ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (ev: CompanyEventRow) => {
    if (!window.confirm(t('deleteConfirm', { title: displayTitle(ev) }))) return
    const { error } = await supabase.from('company_events').delete().eq('id', ev.id)
    if (error) {
      window.alert(error.message)
      return
    }
    if (expandedId === ev.id) setExpandedId(null)
    await fetchEvents()
    flashSuccess(t('deleteSuccess'))
  }

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      'Title (Arabic)': e.title_ar,
      'Title (English)': e.title_en || '',
      'Client Name (Arabic)': e.client_name_ar || '',
      'Client Name (English)': e.client_name_en || '',
      'Location (Arabic)': e.location_ar || '',
      'Location (English)': e.location_en || '',
      'City': e.city || '',
      'Start Date': e.start_date || '',
      'End Date': e.end_date || '',
      'Status': e.status || '',
      'Notes (Arabic)': e.notes_ar || '',
      'Notes (English)': e.notes_en || '',
    }))
    exportToExcel(rows, 'company-events')
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

  const exportButton = (
    <button
      onClick={handleExport}
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
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <FileSpreadsheet size={15} />
      {t('exportButton')}
    </button>
  )

  return (
    <div>
      <PageHeader title={t('pageTitle')} />

      {/* Status tabs */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: statusFilter === s ? 'var(--btn-bg)' : 'transparent',
              borderColor: statusFilter === s ? 'var(--btn-bg)' : 'var(--border-strong)',
              color: statusFilter === s ? 'var(--btn-text)' : 'var(--text-secondary)',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {s === ALL ? t('allOption') : statusLabel(s)}
          </button>
        ))}
        <div style={{ marginInlineStart: isMobile ? 0 : 'auto', display: 'flex', gap: '10px' }}>
          {addButton}
          {exportButton}
        </div>
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
            {filtered.map((event) => {
              const isExpanded = expandedId === event.id
              const notes = displayNotes(event)
              return (
                <div
                  key={event.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: isMobile ? '14px 16px' : '20px 24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {displayTitle(event)}
                        </h3>
                        <StatusBadge status={event.status} label={statusLabel(event.status)} />
                      </div>
                      {displayClient(event) && (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {displayClient(event)}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {displayLocation(event) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <MapPin size={13} />
                            <span>{displayLocation(event)}</span>
                          </div>
                        )}
                        {event.start_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <CalendarDays size={13} />
                            <span>{formatDateRange(event.start_date, event.end_date || event.start_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <PersonCardMenu
                        isRtl={isRtl}
                        optionsAria={t('optionsAria')}
                        editLabel={t('editAria')}
                        deleteLabel={t('deleteAria')}
                        onEdit={() => openEditModal(event)}
                        onDelete={() => handleDelete(event)}
                      />
                      {notes && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          style={{
                            background: 'var(--bg-page)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && notes && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {t('notesLabel')}
                      </div>
                      <div
                        style={{
                          background: 'var(--neutral-bg)',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}
                      >
                        {notes}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
                {events.length === 0 ? t('emptyState') : t('noResultsMessage')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEvent ? t('editModalTitle') : t('addModalTitle')}
      >
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
            <label style={labelStyle}>{t('clientNameArLabel')}</label>
            <input dir="rtl" value={form.client_name_ar} onChange={(e) => setForm((f) => ({ ...f, client_name_ar: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('clientNameEnLabel')}</label>
            <input dir="ltr" value={form.client_name_en} onChange={(e) => setForm((f) => ({ ...f, client_name_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('locationArLabel')}</label>
            <input dir="rtl" value={form.location_ar} onChange={(e) => setForm((f) => ({ ...f, location_ar: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('locationEnLabel')}</label>
            <input dir="ltr" value={form.location_en} onChange={(e) => setForm((f) => ({ ...f, location_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('cityLabel')}</label>
            <input dir={isRtl ? 'rtl' : 'ltr'} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={inputStyle} />
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

          <div>
            <label style={labelStyle}>{t('statusFieldLabel')}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t('notesArLabel')}</label>
            <textarea dir="rtl" value={form.notes_ar} onChange={(e) => setForm((f) => ({ ...f, notes_ar: e.target.value }))} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>{t('notesEnLabel')}</label>
            <textarea dir="ltr" value={form.notes_en} onChange={(e) => setForm((f) => ({ ...f, notes_en: e.target.value }))} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
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
              {saving ? t('saving') : editingEvent ? t('saveButtonEdit') : t('saveButton')}
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
