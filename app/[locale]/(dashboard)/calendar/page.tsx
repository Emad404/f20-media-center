'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight, ChevronLeft, MapPin } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { useIsMobile } from '@/hooks/useIsMobile'

const TASK_TYPES = ['task', 'meeting', 'event', 'deadline'] as const

const todayDate = new Date()
const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

interface TaskRow {
  id: string
  created_by: string | null
  title_ar: string
  title_en: string | null
  task_date: string
  start_time: string | null
  end_time: string | null
  task_type: string | null
  location_ar: string | null
  location_en: string | null
  description_ar: string | null
  description_en: string | null
}

interface AssigneeRow {
  task_id: string
  profile_id: string
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
  email: string
}

type TaskForm = {
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  task_date: string
  start_time: string
  end_time: string
  task_type: string
  location_ar: string
  location_en: string
  assigneeIds: string[]
}

const emptyForm: TaskForm = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  task_date: '',
  start_time: '09:00',
  end_time: '10:00',
  task_type: 'task',
  location_ar: '',
  location_en: '',
  assigneeIds: [],
}

function typeVariant(type: string | null): 'info' | 'gold' | 'danger' | 'success' {
  if (type === 'meeting') return 'info'
  if (type === 'event') return 'gold'
  if (type === 'deadline') return 'danger'
  return 'success'
}

function typeColor(type: string | null): string {
  if (type === 'meeting') return 'var(--info-text)'
  if (type === 'event') return 'var(--gold)'
  if (type === 'deadline') return 'var(--danger-text)'
  return 'var(--success-text)'
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '6px 10px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
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
  marginBottom: '5px',
}

export default function CalendarPage() {
  const t = useTranslations('Calendar')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const daysOfWeek = t.raw('daysOfWeek') as string[]
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [assignees, setAssignees] = useState<AssigneeRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
  const [form, setForm] = useState<TaskForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [tasksRes, assigneesRes, profilesRes] = await Promise.all([
      supabase.from('calendar_tasks').select('*').order('task_date', { ascending: true }),
      supabase.from('calendar_task_assignees').select('*'),
      supabase.from('profiles').select('id,full_name_ar,full_name_en,email'),
    ])
    setTasks(tasksRes.data || [])
    setAssignees(assigneesRes.data || [])
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

  const displayProfileName = (id: string) => {
    const p = profilesById.get(id)
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const assigneeIdsByTask = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const a of assignees) {
      if (!map.has(a.task_id)) map.set(a.task_id, [])
      map.get(a.task_id)!.push(a.profile_id)
    }
    return map
  }, [assignees])

  const displayTitle = (task: TaskRow) => (locale === 'en' && task.title_en ? task.title_en : task.title_ar)
  const displayLocation = (task: TaskRow) => ((locale === 'en' && task.location_en ? task.location_en : task.location_ar) || '')

  const typeLabel = (type: string | null) => {
    if (type === 'meeting') return t('meetingType')
    if (type === 'event') return t('eventType')
    if (type === 'deadline') return t('deadlineType')
    return t('taskType')
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const trailingEmpty = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const task of tasks) {
      if (!map.has(task.task_date)) map.set(task.task_date, [])
      map.get(task.task_date)!.push(task)
    }
    return map
  }, [tasks])

  const selectedTasks = selectedDay ? (tasksByDate.get(selectedDay) ?? []) : []

  function goToPrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const openAddModal = () => {
    setEditingTask(null)
    setForm({ ...emptyForm, task_date: selectedDay || '' })
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (task: TaskRow) => {
    setEditingTask(task)
    setForm({
      title_ar: task.title_ar || '',
      title_en: task.title_en || '',
      description_ar: task.description_ar || '',
      description_en: task.description_en || '',
      task_date: task.task_date || '',
      start_time: task.start_time ? task.start_time.slice(0, 5) : '09:00',
      end_time: task.end_time ? task.end_time.slice(0, 5) : '10:00',
      task_type: task.task_type || 'task',
      location_ar: task.location_ar || '',
      location_en: task.location_en || '',
      assigneeIds: assigneeIdsByTask.get(task.id) || [],
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
    setSaveError('')
  }

  const toggleAssignee = (id: string) => {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter((a) => a !== id) : [...f.assigneeIds, id],
    }))
  }

  const toggleSelectAll = () => {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.length === profiles.length ? [] : profiles.map((p) => p.id),
    }))
  }

  const handleSave = async () => {
    if (!form.title_ar.trim() || !form.task_date) {
      setSaveError(t('formErrorMessage'))
      return
    }

    const payload = {
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      task_date: form.task_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      task_type: form.task_type,
      location_ar: form.location_ar.trim() || null,
      location_en: form.location_en.trim() || null,
    }

    setSaving(true)
    setSaveError('')

    let taskId: string
    if (editingTask) {
      const { error } = await supabase.from('calendar_tasks').update(payload).eq('id', editingTask.id)
      if (error) {
        setSaving(false)
        setSaveError(error.message)
        return
      }
      taskId = editingTask.id
      const { error: delError } = await supabase.from('calendar_task_assignees').delete().eq('task_id', taskId)
      if (delError) {
        setSaving(false)
        setSaveError(delError.message)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('calendar_tasks')
        .insert({ ...payload, created_by: profile?.id || null })
        .select('*')
        .single()
      if (error || !data) {
        setSaving(false)
        setSaveError(error?.message || t('formErrorMessage'))
        return
      }
      taskId = data.id
    }

    if (form.assigneeIds.length > 0) {
      const { error: insError } = await supabase
        .from('calendar_task_assignees')
        .insert(form.assigneeIds.map((profileId) => ({ task_id: taskId, profile_id: profileId })))
      if (insError) {
        setSaving(false)
        setSaveError(insError.message)
        return
      }
    }

    setSaving(false)
    closeModal()
    await fetchAll()
    setSelectedDay(form.task_date)
    flashSuccess(editingTask ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (task: TaskRow) => {
    if (!window.confirm(t('deleteConfirm', { title: displayTitle(task) }))) return
    await supabase.from('calendar_task_assignees').delete().eq('task_id', task.id)
    const { error } = await supabase.from('calendar_tasks').delete().eq('id', task.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const isCurrentDisplayMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month

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
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
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
            transition: 'background-color 0.15s ease',
          }}
        >
          {t('addTaskButton')}
        </button>
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

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 20px' }}>
          <button onClick={goToPrevMonth} style={navBtnStyle}>{isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--navy)' }}>
              {currentMonth.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { calendar: 'gregory', month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <button onClick={goToNextMonth} style={navBtnStyle}>{isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
        </div>

        {/* Calendar grid */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {daysOfWeek.map((d) => (
              <div
                key={d}
                style={{
                  padding: isMobile ? '6px 1px' : '8px',
                  textAlign: 'center',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-page)',
                  borderBottom: '1px solid var(--border)',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-start-${i}`} style={{ minHeight: isMobile ? '60px' : '88px' }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toDateStr(year, month, day)
              const isToday = isCurrentDisplayMonth && dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const dayTasks = tasksByDate.get(dateStr) ?? []

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                  style={{
                    minHeight: isMobile ? '60px' : '88px',
                    background: isToday ? 'var(--gold-light)' : 'var(--bg-card)',
                    border: isSelected
                      ? '2px solid var(--gold)'
                      : isToday
                      ? '1px solid var(--gold)'
                      : '1px solid var(--border)',
                    borderRadius: '0',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '11px' : '13px',
                    fontWeight: isToday ? 700 : 500,
                    width: isMobile ? 20 : 24, height: isMobile ? 20 : 24,
                    borderRadius: '50%',
                    background: isToday ? 'var(--gold)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 2,
                  }}>
                    {day}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {dayTasks.map((task) => (
                      <span
                        key={task.id}
                        title={typeLabel(task.task_type)}
                        style={{
                          width: isMobile ? 38 : 52,
                          minHeight: isMobile ? 38 : 52,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          fontSize: isMobile ? '9px' : '10px',
                          fontWeight: 700,
                          lineHeight: 1.2,
                          borderRadius: '6px',
                          background: typeColor(task.task_type),
                          color: '#fff',
                          padding: '4px',
                          wordBreak: 'break-word',
                        }}
                      >
                        {typeLabel(task.task_type)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}

            {Array.from({ length: trailingEmpty }).map((_, i) => (
              <div key={`empty-end-${i}`} style={{ minHeight: isMobile ? '60px' : '88px' }} />
            ))}
          </div>
        </div>

        {/* Selected day panel */}
        {selectedDay && (
          <div
            style={{
              marginTop: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', marginBottom: '16px' }}>
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
                calendar: 'gregory',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {loading ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>{t('loading')}</p>
            ) : selectedTasks.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                {t('noTasksMessage')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedTasks.map((task) => {
                  const taskAssigneeIds = assigneeIdsByTask.get(task.id) || []
                  return (
                    <div
                      key={task.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      <div style={{ width: '4px', background: typeColor(task.task_type), flexShrink: 0 }} />
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <Badge text={typeLabel(task.task_type)} variant={typeVariant(task.task_type)} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{displayTitle(task)}</span>
                          </div>
                          <PersonCardMenu
                            isRtl={isRtl}
                            optionsAria={t('optionsAria')}
                            editLabel={t('editAria')}
                            deleteLabel={t('deleteAria')}
                            onEdit={() => openEditModal(task)}
                            onDelete={() => handleDelete(task)}
                          />
                        </div>
                        {(task.start_time || task.end_time) && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {task.start_time ? task.start_time.slice(0, 5) : ''}
                            {task.start_time && task.end_time ? ' – ' : ''}
                            {task.end_time ? task.end_time.slice(0, 5) : ''}
                          </div>
                        )}
                        {taskAssigneeIds.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {taskAssigneeIds.map((id) => (
                              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Avatar name={displayProfileName(id) || '?'} size="sm" />
                                <span style={{ fontSize: '13px' }}>{displayProfileName(id)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('unassignedMessage')}</div>
                        )}
                        {displayLocation(task) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <MapPin size={13} />
                            <span>{displayLocation(task)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTask ? t('editTaskModalTitle') : t('addTaskModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
          {saveError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
              {saveError}
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('taskTitleLabel')}</label>
            <input dir="rtl" style={inputStyle} value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required />
          </div>

          <div>
            <label style={labelStyle}>{t('taskTitleEnLabel')}</label>
            <input dir="ltr" style={inputStyle} value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </div>

          <div>
            <label style={labelStyle}>{t('descriptionLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>{t('descriptionEnLabel')}</label>            
            <textarea dir="ltr" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={labelStyle}>{t('assignedToLabel')}</label>
              <button type="button" onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontSize: '12px', cursor: 'pointer' }}>
                {form.assigneeIds.length === profiles.length ? t('deselectAllOption') : t('wholeTeamOption')}
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '160px', overflowY: 'auto', padding: '6px' }}>
              {profiles.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.assigneeIds.includes(p.id)}
                    onChange={() => toggleAssignee(p.id)}
                  />
                  {displayProfileName(p.id)}
                </label>
              ))}
              {profiles.length === 0 && (
                <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{t('noEmployeesMessage')}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{t('dateLabel')}</label>
              <input type="date" style={inputStyle} value={form.task_date} onChange={(e) => setForm({ ...form, task_date: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>{t('taskTypeLabel')}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
                {TASK_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{t('startTimeLabel')}</label>
              <input type="time" style={inputStyle} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>{t('endTimeLabel')}</label>
              <input type="time" style={inputStyle} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('locationLabel')}</label>
            <input dir="rtl" style={inputStyle} value={form.location_ar} onChange={(e) => setForm({ ...form, location_ar: e.target.value })} />
          </div>
          <div>
            <input dir="ltr" style={inputStyle} value={form.location_en} onChange={(e) => setForm({ ...form, location_en: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t('saving') : editingTask ? t('saveButtonEdit') : t('submitButton')}
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
