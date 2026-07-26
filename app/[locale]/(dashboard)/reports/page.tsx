'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, FileSpreadsheet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import StarRating from '@/components/StarRating'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { exportToExcel } from '@/lib/exportXlsx'

const ALL = '__all__'

const COMMITMENT_LEVELS = [
  { key: 'matched', ar: 'مطابق للخطة', en: 'Matched Plan' },
  { key: 'minor', ar: 'تعديل طفيف', en: 'Minor Adjustment' },
  { key: 'major', ar: 'تغيير كبير', en: 'Major Change' },
] as const

interface ReportRow {
  id: string
  company_event_id: string | null
  submitted_by: string | null
  general_goal_ar: string | null
  general_goal_en: string | null
  achieved_goals_ar: string | null
  achieved_goals_en: string | null
  attendance_data_ar: string | null
  attendance_data_en: string | null
  program_rating: number | null
  quality_score: number | null
  commitment_level_ar: string | null
  commitment_level_en: string | null
  strengths_ar: string | null
  strengths_en: string | null
  challenges_ar: string | null
  challenges_en: string | null
  recommendations_ar: string | null
  recommendations_en: string | null
  notes_ar: string | null
  notes_en: string | null
  created_at: string
}

interface CompanyEventLite {
  id: string
  title_ar: string
  title_en: string | null
  location_ar: string | null
  location_en: string | null
  start_date: string | null
  end_date: string | null
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type ReportForm = {
  company_event_id: string
  general_goal_ar: string
  general_goal_en: string
  achieved_goals_ar: string
  achieved_goals_en: string
  attendance_data_ar: string
  attendance_data_en: string
  program_rating: number
  quality_score: number
  commitment_level: string
  strengths_ar: string
  strengths_en: string
  challenges_ar: string
  challenges_en: string
  recommendations_ar: string
  recommendations_en: string
  notes_ar: string
  notes_en: string
}

const emptyForm: ReportForm = {
  company_event_id: '',
  general_goal_ar: '',
  general_goal_en: '',
  achieved_goals_ar: '',
  achieved_goals_en: '',
  attendance_data_ar: '',
  attendance_data_en: '',
  program_rating: 0,
  quality_score: 5,
  commitment_level: 'matched',
  strengths_ar: '',
  strengths_en: '',
  challenges_ar: '',
  challenges_en: '',
  recommendations_ar: '',
  recommendations_en: '',
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
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

function commitmentVariant(ar: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (ar === 'مطابق للخطة') return 'success'
  if (ar === 'تعديل طفيف') return 'warning'
  if (ar === 'تغيير كبير') return 'danger'
  return 'neutral'
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{value || '—'}</span>
    </div>
  )
}

export default function ReportsPage() {
  const t = useTranslations('Reports')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()

  const [reports, setReports] = useState<ReportRow[]>([])
  const [companyEvents, setCompanyEvents] = useState<CompanyEventLite[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState(ALL)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<ReportRow | null>(null)
  const [form, setForm] = useState<ReportForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [reportsRes, eventsRes, profilesRes] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('company_events').select('id,title_ar,title_en,location_ar,location_en,start_date,end_date').order('start_date', { ascending: false }),
      supabase.from('profiles').select('id,full_name_ar,full_name_en'),
    ])
    setReports(reportsRes.data || [])
    setCompanyEvents(eventsRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const companyEventsById = useMemo(() => {
    const map = new Map<string, CompanyEventLite>()
    for (const ce of companyEvents) map.set(ce.id, ce)
    return map
  }, [companyEvents])

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const displayCeTitle = (ce: CompanyEventLite | undefined) => {
    if (!ce) return ''
    return locale === 'en' && ce.title_en ? ce.title_en : ce.title_ar
  }
  const displayCeLocation = (ce: CompanyEventLite | undefined) => {
    if (!ce) return ''
    return (locale === 'en' && ce.location_en ? ce.location_en : ce.location_ar) || ''
  }
  const displayProfileName = (p: ProfileLite | undefined) => {
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const eventTitleFor = (r: ReportRow) => displayCeTitle(r.company_event_id ? companyEventsById.get(r.company_event_id) : undefined)
  const employeeNameFor = (r: ReportRow) => displayProfileName(r.submitted_by ? profilesById.get(r.submitted_by) : undefined)
  const locationFor = (r: ReportRow) => displayCeLocation(r.company_event_id ? companyEventsById.get(r.company_event_id) : undefined)
  const dateFor = (r: ReportRow) => {
    const ce = r.company_event_id ? companyEventsById.get(r.company_event_id) : undefined
    return ce?.start_date || ''
  }
  const goalFor = (r: ReportRow) => ((locale === 'en' && r.general_goal_en ? r.general_goal_en : r.general_goal_ar) || '')
  const achievedFor = (r: ReportRow) => ((locale === 'en' && r.achieved_goals_en ? r.achieved_goals_en : r.achieved_goals_ar) || '')
  const attendanceFor = (r: ReportRow) => ((locale === 'en' && r.attendance_data_en ? r.attendance_data_en : r.attendance_data_ar) || '')
  const commitmentFor = (r: ReportRow) => ((locale === 'en' && r.commitment_level_en ? r.commitment_level_en : r.commitment_level_ar) || '')
  const strengthsFor = (r: ReportRow) => ((locale === 'en' && r.strengths_en ? r.strengths_en : r.strengths_ar) || '')
  const challengesFor = (r: ReportRow) => ((locale === 'en' && r.challenges_en ? r.challenges_en : r.challenges_ar) || '')
  const recommendationsFor = (r: ReportRow) => ((locale === 'en' && r.recommendations_en ? r.recommendations_en : r.recommendations_ar) || '')
  const notesFor = (r: ReportRow) => ((locale === 'en' && r.notes_en ? r.notes_en : r.notes_ar) || '')

  const employeeOptions = useMemo(() => {
    const ids = Array.from(new Set(reports.map((r) => r.submitted_by).filter((id): id is string => !!id)))
    return [ALL, ...ids]
  }, [reports])

  const filtered = useMemo(() => {
    return reports
      .filter((r) => employeeFilter === ALL || r.submitted_by === employeeFilter)
      .filter((r) => {
        if (search === '') return true
        return employeeNameFor(r).includes(search) || eventTitleFor(r).includes(search)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, search, employeeFilter, companyEventsById, profilesById, locale])

  const selected = selectedId != null ? reports.find((r) => r.id === selectedId) : null

  const openAddModal = () => {
    setEditingReport(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (r: ReportRow) => {
    setEditingReport(r)
    const matchedLevel = COMMITMENT_LEVELS.find((l) => l.ar === r.commitment_level_ar)
    setForm({
      company_event_id: r.company_event_id || '',
      general_goal_ar: r.general_goal_ar || '',
      general_goal_en: r.general_goal_en || '',
      achieved_goals_ar: r.achieved_goals_ar || '',
      achieved_goals_en: r.achieved_goals_en || '',
      attendance_data_ar: r.attendance_data_ar || '',
      attendance_data_en: r.attendance_data_en || '',
      program_rating: r.program_rating || 0,
      quality_score: r.quality_score ?? 5,
      commitment_level: matchedLevel ? matchedLevel.key : 'matched',
      strengths_ar: r.strengths_ar || '',
      strengths_en: r.strengths_en || '',
      challenges_ar: r.challenges_ar || '',
      challenges_en: r.challenges_en || '',
      recommendations_ar: r.recommendations_ar || '',
      recommendations_en: r.recommendations_en || '',
      notes_ar: r.notes_ar || '',
      notes_en: r.notes_en || '',
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
    if (!form.company_event_id || !form.general_goal_ar.trim() || !form.program_rating) {
      setSaveError(t('formErrorMessage'))
      return
    }

    const level = COMMITMENT_LEVELS.find((l) => l.key === form.commitment_level) || COMMITMENT_LEVELS[0]

    const payload = {
      company_event_id: form.company_event_id,
      submitted_by: editingReport ? editingReport.submitted_by : profile?.id || null,
      general_goal_ar: form.general_goal_ar.trim(),
      general_goal_en: form.general_goal_en.trim() || null,
      achieved_goals_ar: form.achieved_goals_ar.trim() || null,
      achieved_goals_en: form.achieved_goals_en.trim() || null,
      attendance_data_ar: form.attendance_data_ar.trim() || null,
      attendance_data_en: form.attendance_data_en.trim() || null,
      program_rating: form.program_rating,
      quality_score: form.quality_score,
      commitment_level_ar: level.ar,
      commitment_level_en: level.en,
      strengths_ar: form.strengths_ar.trim() || null,
      strengths_en: form.strengths_en.trim() || null,
      challenges_ar: form.challenges_ar.trim() || null,
      challenges_en: form.challenges_en.trim() || null,
      recommendations_ar: form.recommendations_ar.trim() || null,
      recommendations_en: form.recommendations_en.trim() || null,
      notes_ar: form.notes_ar.trim() || null,
      notes_en: form.notes_en.trim() || null,
    }

    setSaving(true)
    setSaveError('')

    const { data, error } = editingReport
      ? await supabase.from('reports').update(payload).eq('id', editingReport.id).select('*').single()
      : await supabase.from('reports').insert(payload).select('*').single()

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchAll()
    if (data) setSelectedId(data.id)
    flashSuccess(editingReport ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (r: ReportRow) => {
    if (!window.confirm(t('deleteConfirm', { title: eventTitleFor(r) || t('untitledReport') }))) return
    const { error } = await supabase.from('reports').delete().eq('id', r.id)
    if (error) {
      window.alert(error.message)
      return
    }
    if (selectedId === r.id) setSelectedId(null)
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const handleExport = () => {
    const rows = filtered.map((r) => {
      const ce = r.company_event_id ? companyEventsById.get(r.company_event_id) : undefined
      const emp = r.submitted_by ? profilesById.get(r.submitted_by) : undefined
      return {
        'Submitted By (Arabic)': emp?.full_name_ar || '',
        'Submitted By (English)': emp?.full_name_en || '',
        'Event Name (Arabic)': ce?.title_ar || '',
        'Event Name (English)': ce?.title_en || '',
        'Location (Arabic)': ce?.location_ar || '',
        'Location (English)': ce?.location_en || '',
        'Date': ce?.start_date || '',
        'General Goal (Arabic)': r.general_goal_ar || '',
        'General Goal (English)': r.general_goal_en || '',
        'Achieved Goals (Arabic)': r.achieved_goals_ar || '',
        'Achieved Goals (English)': r.achieved_goals_en || '',
        'Attendance Data (Arabic)': r.attendance_data_ar || '',
        'Attendance Data (English)': r.attendance_data_en || '',
        'Program Rating': r.program_rating ?? '',
        'Program Quality': r.quality_score ?? '',
        'Plan Adherence (Arabic)': r.commitment_level_ar || '',
        'Plan Adherence (English)': r.commitment_level_en || '',
        'Strengths (Arabic)': r.strengths_ar || '',
        'Strengths (English)': r.strengths_en || '',
        'Challenges (Arabic)': r.challenges_ar || '',
        'Challenges (English)': r.challenges_en || '',
        'Recommendations (Arabic)': r.recommendations_ar || '',
        'Recommendations (English)': r.recommendations_en || '',
        'Notes (Arabic)': r.notes_ar || '',
        'Notes (English)': r.notes_en || '',
      }
    })
    exportToExcel(rows, 'performance-reports')
  }

  const exportButton = (
    <button
      onClick={handleExport}
      style={{
        background: 'var(--gold)',
        color: '#fff',
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
        transition: 'background-color 0.15s ease',
      }}
    >
      <FileSpreadsheet size={15} />
      {t('exportButton')}
    </button>
  )

  const addButton = (
    <button
      onClick={openAddModal}
      style={{
        background: 'var(--gold)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      }}
    >
      {t('addButton')}
    </button>
  )

  return (
    <div>
      <PageHeader title={t('pageTitle')} />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {exportButton}
        {addButton}
      </div>

      {successMessage && (
        <div style={{
          margin: '16px 16px 0',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--success-bg)',
          color: 'var(--success-text)',
          fontSize: '13px',
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 65px)', overflow: isMobile ? 'visible' : 'hidden', direction: isRtl ? 'rtl' : 'ltr' }}>
        {/* Left panel */}
        <div
          style={{
            width: isMobile ? '100%' : '35%',
            height: isMobile ? '300px' : 'auto',
            overflowY: isMobile ? 'auto' : 'hidden',
            borderLeft: isMobile || !isRtl ? 'none' : '1px solid var(--border)',
            borderRight: isMobile || isRtl ? 'none' : '1px solid var(--border)',
            borderBottom: isMobile ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            overflow: isMobile ? 'auto' : 'hidden',
          }}
        >
          {/* Filters */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  [isRtl ? 'right' : 'left']: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={isRtl ? { ...inputStyle, paddingRight: '30px' } : { ...inputStyle, paddingLeft: '30px' }}
              />
            </div>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {employeeOptions.map((id) => (
                <option key={id} value={id}>
                  {id === ALL ? t('allOption') : displayProfileName(profilesById.get(id))}
                </option>
              ))}
            </select>
          </div>

          {/* Report list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>{t('loading')}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                {reports.length === 0 ? t('emptyState') : t('noResultsMessage')}
              </div>
            ) : (
              filtered.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedId(report.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedId === report.id ? 'var(--gold-light)' : 'transparent',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Avatar name={employeeNameFor(report) || '?'} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{employeeNameFor(report) || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {eventTitleFor(report) || '—'}
                    </div>
                    {dateFor(report) && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatArabicDate(dateFor(report))}
                      </div>
                    )}
                  </div>
                  <StarRating value={report.program_rating || 0} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', padding: isMobile ? '16px' : '24px' }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
              {t('selectReportMessage')}
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy)' }}>{eventTitleFor(selected) || t('untitledReport')}</h2>
                <PersonCardMenu
                  isRtl={isRtl}
                  optionsAria={t('optionsAria')}
                  editLabel={t('editAria')}
                  deleteLabel={t('deleteAria')}
                  onEdit={() => openEditModal(selected)}
                  onDelete={() => handleDelete(selected)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label={t('employeeNameLabel')} value={employeeNameFor(selected)} />
                <DetailRow label={t('eventNameLabel')} value={eventTitleFor(selected)} />
                <DetailRow label={t('locationLabel')} value={locationFor(selected)} />
                <DetailRow label={t('dateLabel')} value={dateFor(selected) ? formatArabicDate(dateFor(selected)) : ''} />
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label={t('generalGoalLabel')} value={goalFor(selected)} />
                <DetailRow label={t('achievedGoalsLabel')} value={achievedFor(selected)} />
                <DetailRow label={t('attendanceDataLabel')} value={attendanceFor(selected)} />
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('programRatingLabel')}</span>
                  <StarRating value={selected.program_rating || 0} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('programQualityLabel')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--neutral-bg)', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${((selected.quality_score || 0) / 10) * 100}%`,
                          height: '100%',
                          background: 'var(--gold)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
                      {selected.quality_score ?? 0}/10
                    </span>
                  </div>
                </div>
                {commitmentFor(selected) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('adherenceLabel')}</span>
                    <Badge text={commitmentFor(selected)} variant={commitmentVariant(selected.commitment_level_ar)} />
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label={t('strengthsLabel')} value={strengthsFor(selected)} />
                <DetailRow label={t('challengesLabel')} value={challengesFor(selected)} />
                <DetailRow label={t('recommendationsLabel')} value={recommendationsFor(selected)} />
                <DetailRow label={t('notesLabel')} value={notesFor(selected)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingReport ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
          {saveError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
              {saveError}
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('companyEventFieldLabel')}</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.company_event_id}
              onChange={(e) => setForm((f) => ({ ...f, company_event_id: e.target.value }))}
            >
              <option value="">{t('companyEventPlaceholder')}</option>
              {companyEvents.map((ce) => (
                <option key={ce.id} value={ce.id}>
                  {displayCeTitle(ce)}{ce.start_date ? ` — ${formatArabicDate(ce.start_date)}` : ''}
                </option>
              ))}
            </select>
            {companyEvents.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('noCompanyEventsMessage')}</div>
            )}
          </div>

          <div>
            <label style={labelStyle}>{t('generalGoalFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.general_goal_ar} onChange={(e) => setForm((f) => ({ ...f, general_goal_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('generalGoalEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.general_goal_en} onChange={(e) => setForm((f) => ({ ...f, general_goal_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('achievedGoalsFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.achieved_goals_ar} onChange={(e) => setForm((f) => ({ ...f, achieved_goals_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('achievedGoalsEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.achieved_goals_en} onChange={(e) => setForm((f) => ({ ...f, achieved_goals_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('attendanceDataFieldLabel')}</label>
            <input dir="rtl" style={inputStyle} value={form.attendance_data_ar} onChange={(e) => setForm((f) => ({ ...f, attendance_data_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('attendanceDataEnFieldLabel')}</label>
            <input dir="ltr" style={inputStyle} value={form.attendance_data_en} onChange={(e) => setForm((f) => ({ ...f, attendance_data_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('programRatingFieldLabel')}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, program_rating: star }))}
                  style={{
                    fontSize: '24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= form.program_rating ? 'var(--gold)' : 'var(--border-strong)',
                    padding: '2px',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{t('programQualityFieldLabel')}</label>
              <input
                type="number"
                min="0"
                max="10"
                style={inputStyle}
                value={form.quality_score}
                onChange={(e) => setForm((f) => ({ ...f, quality_score: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('adherenceLabel')}</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.commitment_level}
                onChange={(e) => setForm((f) => ({ ...f, commitment_level: e.target.value }))}
              >
                <option value="matched">{t('adherenceMatchedOption')}</option>
                <option value="minor">{t('adherenceMinorOption')}</option>
                <option value="major">{t('adherenceMajorOption')}</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('strengthsFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.strengths_ar} onChange={(e) => setForm((f) => ({ ...f, strengths_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('strengthsEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.strengths_en} onChange={(e) => setForm((f) => ({ ...f, strengths_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('challengesFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.challenges_ar} onChange={(e) => setForm((f) => ({ ...f, challenges_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('challengesEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.challenges_en} onChange={(e) => setForm((f) => ({ ...f, challenges_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('recommendationsFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.recommendations_ar} onChange={(e) => setForm((f) => ({ ...f, recommendations_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('recommendationsEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.recommendations_en} onChange={(e) => setForm((f) => ({ ...f, recommendations_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('notesFieldLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes_ar} onChange={(e) => setForm((f) => ({ ...f, notes_ar: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('notesEnFieldLabel')}</label>
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes_en} onChange={(e) => setForm((f) => ({ ...f, notes_en: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t('saving') : editingReport ? t('saveButtonEdit') : t('saveButton')}
            </button>
            <button
              type="button"
              onClick={closeModal}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', cursor: 'pointer' }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
