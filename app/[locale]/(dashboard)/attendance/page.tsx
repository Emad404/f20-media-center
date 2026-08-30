'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Pencil, X } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import Badge from '@/components/Badge'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatArabicDate, formatDateTime } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { exportToExcel, exportToExcelSheets } from '@/lib/exportXlsx'

const ALL = '__all__'
const MANAGE_ROLES = ['developer', 'ceo', 'project_manager']

// Must match the timezone baked into attendance_records.check_in_date
// (a generated column) in the database - see the attendance feature's setup SQL.
const ATTENDANCE_TIMEZONE = 'Asia/Riyadh'

interface AttendanceRecord {
  id: string
  employee_id: string
  check_in: string
  check_out: string | null
  marked_by: string | null
  notes: string | null
  created_at: string
  check_in_date: string
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type RecordForm = {
  employee_id: string
  check_in: string
  check_out: string
  notes: string
}

const emptyForm: RecordForm = { employee_id: '', check_in: '', check_out: '', notes: '' }

function todayInAttendanceTimezone(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ATTENDANCE_TIMEZONE })
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

function computeHours(checkIn: string, checkOut: string | null): number | null {
  if (!checkOut) return null
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.round((ms / 3600000) * 100) / 100
}

function formatTimeOnly(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'ar-SA', { hour: 'numeric', minute: '2-digit' })
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

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-strong)',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const smallButtonStyle: React.CSSProperties = {
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const smallSecondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-strong)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--navy)',
  marginBottom: '14px',
}

function thStyle(isRtl: boolean): React.CSSProperties {
  return {
    textAlign: isRtl ? 'right' : 'left',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-page)',
    whiteSpace: 'nowrap',
  }
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
}

export default function AttendancePage() {
  const t = useTranslations('Attendance')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && MANAGE_ROLES.includes(profile.role)

  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([])
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [employeeFilter, setEmployeeFilter] = useState(ALL)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [form, setForm] = useState<RecordForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    if (!profile) return
    setLoading(true)
    if (canManage) {
      const [recordsRes, profilesRes] = await Promise.all([
        supabase.from('attendance_records').select('*').order('check_in', { ascending: false }),
        supabase.from('profiles').select('id,full_name_ar,full_name_en'),
      ])
      const records = recordsRes.data || []
      setAllRecords(records)
      setProfiles(profilesRes.data || [])
      setMyRecords(records.filter((r) => r.employee_id === profile.id))
    } else {
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', profile.id)
        .order('check_in', { ascending: false })
      setMyRecords(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [profile?.id, canManage])

  const todayStr = useMemo(() => todayInAttendanceTimezone(), [])
  const todayRecord = useMemo(() => myRecords.find((r) => r.check_in_date === todayStr), [myRecords, todayStr])

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const displayProfileName = (p: ProfileLite | undefined) => {
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const employeeNameFor = (r: AttendanceRecord) => displayProfileName(profilesById.get(r.employee_id))

  const employeeOptions = useMemo(() => {
    return [...profiles].sort((a, b) => displayProfileName(a).localeCompare(displayProfileName(b), locale))
  }, [profiles, locale])

  const filteredRecords = useMemo(() => {
    return allRecords
      .filter((r) => employeeFilter === ALL || r.employee_id === employeeFilter)
      .filter((r) => !fromDate || r.check_in_date >= fromDate)
      .filter((r) => !toDate || r.check_in_date <= toDate)
  }, [allRecords, employeeFilter, fromDate, toDate])

  const handleCheckIn = async () => {
    if (!profile) return
    setActionLoading(true)
    setErrorMessage('')
    const { error } = await supabase.from('attendance_records').insert({
      employee_id: profile.id,
      check_in: new Date().toISOString(),
    })
    setActionLoading(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('checkInSuccess'))
  }

  const handleCheckOut = async () => {
    if (!todayRecord) return
    setActionLoading(true)
    setErrorMessage('')
    const { error } = await supabase
      .from('attendance_records')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayRecord.id)
    setActionLoading(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('checkOutSuccess'))
  }

  const startEditNotes = (r: AttendanceRecord) => {
    setEditingNotesId(r.id)
    setNotesDraft(r.notes || '')
  }

  const cancelEditNotes = () => {
    setEditingNotesId(null)
    setNotesDraft('')
  }

  const saveNotes = async (r: AttendanceRecord) => {
    const { error } = await supabase
      .from('attendance_records')
      .update({ notes: notesDraft.trim() || null })
      .eq('id', r.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setEditingNotesId(null)
    await fetchAll()
    flashSuccess(t('notesSaved'))
  }

  const openAddModal = () => {
    setEditingRecord(null)
    setForm({ employee_id: '', check_in: '', check_out: '', notes: '' })
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (r: AttendanceRecord) => {
    setEditingRecord(r)
    setForm({
      employee_id: r.employee_id,
      check_in: toDatetimeLocalValue(r.check_in),
      check_out: r.check_out ? toDatetimeLocalValue(r.check_out) : '',
      notes: r.notes || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.employee_id || !form.check_in) {
      setSaveError(t('formErrorMessage'))
      return
    }
    const checkInIso = fromDatetimeLocalValue(form.check_in)
    const checkOutIso = form.check_out ? fromDatetimeLocalValue(form.check_out) : null
    if (!checkInIso) {
      setSaveError(t('formErrorMessage'))
      return
    }
    if (checkOutIso && checkOutIso < checkInIso) {
      setSaveError(t('checkOutBeforeCheckInError'))
      return
    }

    const payload: Record<string, unknown> = {
      employee_id: form.employee_id,
      check_in: checkInIso,
      check_out: checkOutIso,
      notes: form.notes.trim() || null,
    }
    if (!editingRecord) payload.marked_by = profile?.id

    setSaving(true)
    setSaveError('')
    const { error } = editingRecord
      ? await supabase.from('attendance_records').update(payload).eq('id', editingRecord.id)
      : await supabase.from('attendance_records').insert(payload)
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchAll()
    flashSuccess(editingRecord ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (r: AttendanceRecord) => {
    if (!window.confirm(t('deleteConfirm', { name: employeeNameFor(r) }))) return
    const { error } = await supabase.from('attendance_records').delete().eq('id', r.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const handleExport = () => {
    const rowFor = (r: AttendanceRecord) => ({
      Employee: employeeNameFor(r),
      Date: r.check_in_date,
      'Check In': formatDateTime(r.check_in, locale),
      'Check Out': r.check_out ? formatDateTime(r.check_out, locale) : '',
      'Hours Worked': computeHours(r.check_in, r.check_out) ?? '',
      Notes: r.notes || '',
    })

    const employeeIdsInView = Array.from(new Set(filteredRecords.map((r) => r.employee_id)))
    if (employeeIdsInView.length <= 1) {
      exportToExcel(filteredRecords.map(rowFor), 'attendance')
    } else {
      const sheets = employeeIdsInView.map((id) => ({
        name: displayProfileName(profilesById.get(id)) || 'Employee',
        rows: filteredRecords.filter((r) => r.employee_id === id).map(rowFor),
      }))
      exportToExcelSheets(sheets, 'attendance')
    }
  }

  const clearFilters = () => {
    setEmployeeFilter(ALL)
    setFromDate('')
    setToDate('')
  }

  return (
    <div>
      <PageHeader title={t('pageTitle')} subtitle={t('subtitle')} />

      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {successMessage && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--success-bg)',
              color: 'var(--success-text)',
              fontSize: '13px',
            }}
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              fontSize: '13px',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Check-in card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '480px',
            margin: '0 auto 32px',
            textAlign: 'center',
          }}
        >
          {!todayRecord && (
            <>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('notCheckedInYet')}</div>
              <button onClick={handleCheckIn} disabled={actionLoading} style={{ ...primaryButtonStyle, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? t('saving') : t('checkInButton')}
              </button>
            </>
          )}
          {todayRecord && !todayRecord.check_out && (
            <>
              <Badge text={t('statusCheckedIn')} variant="success" />
              <div style={{ fontSize: '14px', color: 'var(--success-text)', fontWeight: 600 }}>
                {t('checkedInAt', { time: formatDateTime(todayRecord.check_in, locale) })}
              </div>
              <button onClick={handleCheckOut} disabled={actionLoading} style={{ ...primaryButtonStyle, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? t('saving') : t('checkOutButton')}
              </button>
            </>
          )}
          {todayRecord && todayRecord.check_out && (
            <>
              <Badge text={t('statusCheckedOut')} variant="success" />
              <div style={{ fontSize: '14px', color: 'var(--success-text)', fontWeight: 600 }}>
                {t('checkedInAt', { time: formatDateTime(todayRecord.check_in, locale) })}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--success-text)', fontWeight: 600 }}>
                {t('checkedOutAt', { time: formatDateTime(todayRecord.check_out, locale) })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('doneForToday')}</div>
            </>
          )}
        </div>

        {/* My history — card style matches the Hilal Predictions "My History" section */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: canManage ? '36px' : 0,
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#000A46', marginBottom: '16px' }}>{t('historyTitle')}</h2>
          {loading ? (
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
          ) : myRecords.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('historyEmpty')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myRecords.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatArabicDate(r.check_in_date, locale)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: 600, marginTop: '2px' }}>
                        {t('checkedInAt', { time: formatTimeOnly(r.check_in, locale) })}
                      </div>
                      {r.check_out && (
                        <div style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: 600, marginTop: '2px' }}>
                          {t('checkedOutAt', { time: formatTimeOnly(r.check_out, locale) })}
                        </div>
                      )}
                    </div>
                    {!r.check_out && <Badge text={t('statusCheckedIn')} variant="success" />}
                  </div>

                  {editingNotesId === r.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={labelStyle}>{t('notesLabel')}</label>
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                        placeholder={t('notesPlaceholder')}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => saveNotes(r)} style={smallButtonStyle}>{t('saveNotes')}</button>
                        <button onClick={cancelEditNotes} style={smallSecondaryButtonStyle}>{t('cancelButton')}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={labelStyle}>{t('notesLabel')}</div>
                        <div style={{ fontSize: '13px', color: r.notes ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                          {r.notes || t('noNotes')}
                        </div>
                      </div>
                      <button
                        onClick={() => startEditNotes(r)}
                        aria-label={t('editNotesAria')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager panel */}
        {canManage && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>{t('allRecordsTitle')}</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={openAddModal} style={smallButtonStyle}>{t('addRecordButton')}</button>
                <button onClick={handleExport} style={smallSecondaryButtonStyle}>{t('exportButton')}</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
              >
                <option value={ALL}>{t('allOption')}</option>
                {employeeOptions.map((p) => (
                  <option key={p.id} value={p.id}>{displayProfileName(p)}</option>
                ))}
              </select>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {t('fromDateLabel')}
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {t('toDateLabel')}
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
              />
              {(employeeFilter !== ALL || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  aria-label={t('clearFiltersAria')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle(isRtl)}>{t('employeeHeader')}</th>
                    <th style={thStyle(isRtl)}>{t('checkInHeader')}</th>
                    <th style={thStyle(isRtl)}>{t('checkOutHeader')}</th>
                    <th style={thStyle(isRtl)}>{t('hoursHeader')}</th>
                    <th style={thStyle(isRtl)}>{t('notesHeader')}</th>
                    <th style={thStyle(isRtl)} />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => {
                    const hours = computeHours(r.check_in, r.check_out)
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>{employeeNameFor(r)}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatArabicDate(r.check_in, locale)}</div>
                          <div style={{ color: 'var(--success-text)', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                            {formatTimeOnly(r.check_in, locale)}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {r.check_out ? (
                            <>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatArabicDate(r.check_out, locale)}</div>
                              <div style={{ color: 'var(--success-text)', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                                {formatTimeOnly(r.check_out, locale)}
                              </div>
                            </>
                          ) : '—'}
                        </td>
                        <td style={tdStyle}>{hours !== null ? `${hours.toFixed(2)} ${t('hoursUnit')}` : '—'}</td>
                        <td style={{ ...tdStyle, maxWidth: '220px', whiteSpace: 'pre-wrap' }}>{r.notes || '—'}</td>
                        <td style={tdStyle}>
                          <PersonCardMenu
                            isRtl={isRtl}
                            optionsAria={t('optionsAria')}
                            editLabel={t('editAria')}
                            deleteLabel={t('deleteAria')}
                            onEdit={() => openEditModal(r)}
                            onDelete={() => handleDelete(r)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!loading && filteredRecords.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {allRecords.length === 0 ? t('emptyState') : t('noResultsMessage')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal (manager override) */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRecord ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('employeeLabel')} *</label>
            <select
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              style={inputStyle}
            >
              <option value="" disabled>{t('selectEmployeePlaceholder')}</option>
              {employeeOptions.map((p) => (
                <option key={p.id} value={p.id}>{displayProfileName(p)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t('checkInLabel')} *</label>
            <input
              type="datetime-local"
              value={form.check_in}
              onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('checkOutLabel')}</label>
            <input
              type="datetime-local"
              value={form.check_out}
              onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('notesLabel')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          {saveError && <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{saveError}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...primaryButtonStyle, padding: '10px 20px', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? t('saving') : editingRecord ? t('saveButtonEdit') : t('saveButton')}
            </button>
            <button onClick={closeModal} style={secondaryButtonStyle}>{t('cancelButton')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
