'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft, MapPin } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import { tasks as initialTasks, type Task, type TaskType } from '@/data/tasks'
import { employees } from '@/data/employees'
import { useIsMobile } from '@/hooks/useIsMobile'

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const todayDate = new Date()
const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

function typeVariant(type: TaskType): 'info' | 'gold' | 'danger' | 'neutral' {
  if (type === 'meeting') return 'info'
  if (type === 'event') return 'gold'
  if (type === 'deadline') return 'danger'
  return 'neutral'
}

function typeLabel(type: TaskType): string {
  if (type === 'meeting') return 'اجتماع'
  if (type === 'event') return 'فعالية'
  if (type === 'deadline') return 'موعد نهائي'
  return 'مهمة'
}

function dotColor(type: TaskType): string {
  if (type === 'meeting') return 'var(--info-text)'
  if (type === 'event') return 'var(--gold)'
  if (type === 'deadline') return 'var(--danger-text)'
  return 'var(--text-muted)'
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
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

const emptyForm = {
  title: '',
  description: '',
  assignedTo: 'الفريق بأكمله',
  assignedEmail: 'team@f20event.com',
  date: '',
  time: '09:00',
  duration: 60,
  type: 'task' as TaskType,
  location: '',
}

const DAYS_AR_SHORT = ['الأح', 'الإث', 'الثل', 'الأر', 'الخم', 'الجم', 'الست']

export default function CalendarPage() {
  const isMobile = useIsMobile()
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [taskList, setTaskList] = useState<Task[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const trailingEmpty = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of taskList) {
      if (!map.has(task.date)) map.set(task.date, [])
      map.get(task.date)!.push(task)
    }
    return map
  }, [taskList])

  const selectedTasks = selectedDay ? (tasksByDate.get(selectedDay) ?? []) : []

  function goToPrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  function handleAssignedChange(name: string) {
    const emp = employees.find((e) => e.name === name)
    setForm((f) => ({
      ...f,
      assignedTo: name,
      assignedEmail: emp ? emp.email : 'team@f20event.com',
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date || !form.time) return
    const newTask: Task = {
      id: Date.now(),
      ...form,
    }
    setTaskList((prev) => [...prev, newTask])
    setIsModalOpen(false)
    setForm({ ...emptyForm })
    setSelectedDay(newTask.date)
  }

  const isCurrentDisplayMonth =
    todayDate.getFullYear() === year && todayDate.getMonth() === month

  return (
    <div>
      <PageHeader
        title="التقويم"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
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
            + إضافة مهمة
          </button>
        }
      />

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 20px' }}>
          <button onClick={goToPrevMonth} style={navBtnStyle}><ChevronRight size={18} /></button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--navy)' }}>
              {currentMonth.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <button onClick={goToNextMonth} style={navBtnStyle}><ChevronLeft size={18} /></button>
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
            {(isMobile ? DAYS_AR_SHORT : DAYS_AR).map((d) => (
              <div
                key={d}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-page)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Leading empty slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-start-${i}`} style={{ minHeight: isMobile ? '60px' : '88px' }} />
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toDateStr(year, month, day)
              const isToday = isCurrentDisplayMonth && dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const dayTasks = tasksByDate.get(dateStr) ?? []
              const hasTasks = dayTasks.length > 0

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
                    cursor: hasTasks ? 'pointer' : 'default',
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

                  {/* Task dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {dayTasks.slice(0, 3).map((task) => (
                      <span key={task.id} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: dotColor(task.type),
                        display: 'inline-block',
                      }} />
                    ))}
                    {dayTasks.length > 3 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{dayTasks.length - 3}</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Trailing empty slots */}
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
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {selectedTasks.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                لا توجد مهام في هذا اليوم
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    {/* Left indicator strip */}
                    <div style={{
                      width: '4px',
                      background: dotColor(task.type),
                      flexShrink: 0,
                    }} />
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Badge text={typeLabel(task.type)} variant={typeVariant(task.type)} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{task.title}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {task.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={task.assignedTo} size="sm" />
                        <span style={{ fontSize: '13px' }}>{task.assignedTo}</span>
                        <a href={`mailto:${task.assignedEmail}`} style={{ fontSize: '12px', color: 'var(--gold-dark)' }}>
                          {task.assignedEmail}
                        </a>
                      </div>
                      {task.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <MapPin size={13} />
                          <span>{task.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setForm({ ...emptyForm }) }} title="إضافة مهمة جديدة">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>عنوان المهمة *</label>
            <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <label style={labelStyle}>الوصف</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>المسؤول</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.assignedTo}
              onChange={(e) => handleAssignedChange(e.target.value)}
            >
              <option value="الفريق بأكمله">الفريق بأكمله</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>التاريخ *</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>الوقت *</label>
              <input type="time" style={inputStyle} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>المدة (دقيقة)</label>
              <input
                type="number"
                min="5"
                style={inputStyle}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>النوع</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })}
              >
                <option value="task">مهمة</option>
                <option value="meeting">اجتماع</option>
                <option value="event">فعالية</option>
                <option value="deadline">موعد نهائي</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>الموقع (اختياري)</label>
            <input style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="submit"
              style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              إضافة المهمة
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setForm({ ...emptyForm }) }}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
