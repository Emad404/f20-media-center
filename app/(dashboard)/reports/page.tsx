'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import StarRating from '@/components/StarRating'
import Modal from '@/components/Modal'
import { reports as initialReports, type PerformanceReport } from '@/data/reports'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

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

function adherenceVariant(a: string): 'success' | 'warning' | 'danger' {
  if (a === 'مطابق للخطة') return 'success'
  if (a === 'تعديل طفيف') return 'warning'
  return 'danger'
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{value || '—'}</span>
    </div>
  )
}

const emptyForm = {
  employeeName: '',
  eventName: '',
  location: '',
  date: '',
  generalGoal: '',
  achievedGoals: '',
  attendanceData: '',
  programRating: 0,
  programQuality: 5,
  adherence: 'مطابق للخطة' as PerformanceReport['adherence'],
  positives: '',
  challenges: '',
  recommendations: '',
  notes: '',
}

export default function ReportsPage() {
  const isMobile = useIsMobile()
  const [reportList, setReportList] = useState<PerformanceReport[]>(initialReports)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('الكل')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const employees = useMemo(() => {
    const names = Array.from(new Set(reportList.map((r) => r.employeeName)))
    return ['الكل', ...names]
  }, [reportList])

  const filtered = useMemo(() => {
    return reportList
      .filter((r) => employeeFilter === 'الكل' || r.employeeName === employeeFilter)
      .filter(
        (r) =>
          search === '' ||
          r.employeeName.includes(search) ||
          r.eventName.includes(search)
      )
  }, [reportList, search, employeeFilter])

  const selected = selectedId != null ? reportList.find((r) => r.id === selectedId) : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.employeeName || !form.eventName || !form.location || !form.date || !form.generalGoal || !form.programRating) {
      setFormError('يرجى تعبئة جميع الحقول الإلزامية')
      return
    }
    const newReport: PerformanceReport = {
      id: Date.now(),
      ...form,
    }
    setReportList((prev) => [newReport, ...prev])
    setIsModalOpen(false)
    setForm(emptyForm)
    setFormError('')
    setSelectedId(newReport.id)
  }

  return (
    <div>
      <PageHeader
        title="تقارير الأداء"
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
            + إضافة تقرير
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 65px)', overflow: isMobile ? 'visible' : 'hidden' }}>
        {/* Left panel — 35% on desktop, full width + fixed height on mobile */}
        <div
          style={{
            width: isMobile ? '100%' : '35%',
            height: isMobile ? '300px' : 'auto',
            overflowY: isMobile ? 'auto' : 'hidden',
            borderLeft: isMobile ? 'none' : '1px solid var(--border)',
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
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingRight: '30px' }}
              />
            </div>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {employees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>

          {/* Report list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((report) => (
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
                <Avatar name={report.employeeName} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{report.employeeName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.eventName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatArabicDate(report.date)}
                  </div>
                </div>
                <StarRating value={report.programRating} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                لا توجد نتائج
              </div>
            )}
          </div>
        </div>

        {/* Right panel — 65% on desktop, full width below on mobile */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', padding: isMobile ? '16px' : '24px' }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
              اختر تقريراً من القائمة
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy)' }}>{selected.eventName}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label="اسم الموظف" value={selected.employeeName} />
                <DetailRow label="اسم الفعالية" value={selected.eventName} />
                <DetailRow label="الموقع" value={selected.location} />
                <DetailRow label="التاريخ" value={formatArabicDate(selected.date)} />
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label="الهدف العام" value={selected.generalGoal} />
                <DetailRow label="الأهداف المحققة" value={selected.achievedGoals} />
                <DetailRow label="بيانات الحضور" value={selected.attendanceData} />
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>تقييم البرنامج</span>
                  <StarRating value={selected.programRating} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>جودة البرنامج</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--neutral-bg)', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${(selected.programQuality / 10) * 100}%`,
                          height: '100%',
                          background: 'var(--gold)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
                      {selected.programQuality}/10
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>الالتزام بالخطة</span>
                  <Badge text={selected.adherence} variant={adherenceVariant(selected.adherence)} />
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <DetailRow label="الإيجابيات" value={selected.positives} />
                <DetailRow label="التحديات" value={selected.challenges} />
                <DetailRow label="التوصيات" value={selected.recommendations} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Report Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setForm(emptyForm); setFormError('') }} title="إضافة تقرير جديد">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>اسم الموظف *</label>
              <input style={inputStyle} value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>اسم الفعالية *</label>
              <input style={inputStyle} value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>الموقع *</label>
              <input style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>التاريخ *</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>الهدف العام *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.generalGoal}
              onChange={(e) => setForm({ ...form, generalGoal: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>الأهداف المحققة</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.achievedGoals}
              onChange={(e) => setForm({ ...form, achievedGoals: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>بيانات الحضور</label>
            <input style={inputStyle} value={form.attendanceData} onChange={(e) => setForm({ ...form, attendanceData: e.target.value })} />
          </div>

          <div>
            <label style={labelStyle}>تقييم البرنامج (1-5) *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, programRating: star })}
                  style={{
                    fontSize: '24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= form.programRating ? 'var(--gold)' : 'var(--border-strong)',
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
              <label style={labelStyle}>جودة البرنامج (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                style={inputStyle}
                value={form.programQuality}
                onChange={(e) => setForm({ ...form, programQuality: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>الالتزام بالخطة</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.adherence}
                onChange={(e) => setForm({ ...form, adherence: e.target.value as PerformanceReport['adherence'] })}
              >
                <option value="مطابق للخطة">مطابق للخطة</option>
                <option value="تعديل طفيف">تعديل طفيف</option>
                <option value="تغيير كبير">تغيير كبير</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>الإيجابيات</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.positives} onChange={(e) => setForm({ ...form, positives: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>التحديات</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>التوصيات</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', paddingTop: '4px' }}>
            <button
              type="submit"
              style={{ background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              حفظ التقرير
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setForm(emptyForm); setFormError('') }}
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
