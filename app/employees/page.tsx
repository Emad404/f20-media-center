'use client'

import { useState, useMemo } from 'react'
import { X, Search, Mail, Phone } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { employees, type Employee } from '@/data/employees'
import { useIsMobile } from '@/hooks/useIsMobile'

function deptVariant(dept: string): 'gold' | 'success' | 'warning' | 'info' | 'neutral' {
  if (dept === 'الإدارة العليا') return 'gold'
  if (dept === 'المشاريع') return 'success'
  if (dept === 'التسويق') return 'warning'
  if (dept === 'الإعلام') return 'info'
  return 'neutral'
}

function roleColor(role: string): string {
  if (role === 'المدير التنفيذي') return 'var(--gold)'
  if (role === 'نائب المدير') return '#4F46E5'
  if (role.startsWith('مدير') || role.startsWith('مديرة')) return 'var(--navy-mid)'
  if (role.startsWith('منسّق') || role.startsWith('منسّقة')) return '#0891B2'
  if (role.startsWith('مصوّر') || role.startsWith('مصمّمة')) return '#7C3AED'
  return 'var(--border-strong)'
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2)
  return words[0][0] + words[words.length - 1][0]
}

function orgNodeStyle(emp: Employee): React.CSSProperties {
  if (emp.level === 1) return {
    background: 'var(--gold-light)',
    border: '2px solid var(--gold)',
  }
  if (emp.role === 'نائب المدير') return {
    background: '#EEF2FF',
    border: '2px solid var(--navy-mid)',
  }
  if (emp.level === 2) return {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-strong)',
  }
  return {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  }
}

function OrgNode({ emp, onSelect }: { emp: Employee; onSelect: (e: Employee) => void }) {
  const isCeo = emp.level === 1
  return (
    <div
      onClick={() => onSelect(emp)}
      style={{
        padding: '12px 16px',
        borderRadius: '12px',
        textAlign: 'center',
        minWidth: isCeo ? '160px' : '130px',
        maxWidth: '160px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s ease',
        ...orgNodeStyle(emp),
      }}
    >
      <div style={{
        width: isCeo ? 48 : 40,
        height: isCeo ? 48 : 40,
        borderRadius: '50%',
        background: 'var(--neutral-bg)',
        margin: '0 auto 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isCeo ? '16px' : '14px',
        fontWeight: 600,
        color: emp.level === 1 ? 'var(--gold-dark)' : 'var(--text-secondary)',
      }}>
        {getInitials(emp.name)}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: emp.level === 1 ? 'var(--gold-dark)' : 'var(--text-primary)' }}>
        {emp.name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.role}</div>
      <Badge text={emp.department} variant="neutral" />
    </div>
  )
}

function VerticalLine() {
  return (
    <div style={{ width: '1px', height: '20px', background: 'var(--border-strong)', alignSelf: 'center' }} />
  )
}

export default function EmployeesPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<'org' | 'list'>('org')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('الكل')
  const [roleFilter, setRoleFilter] = useState('الكل')

  const ceo = employees.find((e) => e.level === 1)!
  const vp = employees.find((e) => e.role === 'نائب المدير')!
  const level2Others = employees.filter((e) => e.level === 2 && e.role !== 'نائب المدير')
  const level2All = employees.filter((e) => e.level === 2)
  const getChildren = (managerId: number) => employees.filter((e) => e.managerId === managerId)

  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department)))
    return ['الكل', ...depts]
  }, [])

  const roles = useMemo(() => {
    const rs = Array.from(new Set(employees.map((e) => e.role)))
    return ['الكل', ...rs]
  }, [])

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e) => deptFilter === 'الكل' || e.department === deptFilter)
      .filter((e) => roleFilter === 'الكل' || e.role === roleFilter)
      .filter(
        (e) =>
          search === '' ||
          e.name.includes(search) ||
          e.role.includes(search)
      )
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level
        if (a.level === b.level && a.level === 1) return 0
        if (a.role === 'نائب المدير') return -1
        if (b.role === 'نائب المدير') return 1
        return a.name.localeCompare(b.name, 'ar')
      })
  }, [search, deptFilter, roleFilter])

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div>
      <PageHeader
        title="الموظفون"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setView('org')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                background: view === 'org' ? 'var(--gold)' : 'transparent',
                borderColor: view === 'org' ? 'var(--gold)' : 'var(--border-strong)',
                color: view === 'org' ? '#fff' : 'var(--text-secondary)',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              شجرة التنظيم
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                background: view === 'list' ? 'var(--gold)' : 'transparent',
                borderColor: view === 'list' ? 'var(--gold)' : 'var(--border-strong)',
                color: view === 'list' ? '#fff' : 'var(--text-secondary)',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              قائمة الموظفين
            </button>
          </div>
        }
      />

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {view === 'org' ? (
          /* ORG CHART */
          <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '900px',
              transform: isMobile ? 'scale(0.7)' : undefined,
              transformOrigin: isMobile ? 'top center' : undefined,
            }}>
              {/* CEO */}
              <OrgNode emp={ceo} onSelect={setSelectedEmployee} />
              <VerticalLine />

              {/* VP directly below CEO */}
              <OrgNode emp={vp} onSelect={setSelectedEmployee} />
              <VerticalLine />

              {/* Level 2 others + VP children row */}
              <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start' }}>
                {/* VP's direct reports */}
                {(() => {
                  const vpChildren = getChildren(vp.id)
                  return vpChildren.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start' }}>
                      {vpChildren.map((child) => (
                        <div
                          key={child.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '0 12px',
                            borderTop: '1px solid var(--border-strong)',
                            paddingTop: '20px',
                          }}
                        >
                          <OrgNode emp={child} onSelect={setSelectedEmployee} />
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Other Level 2 managers and their children */}
                {level2Others.map((l2emp) => {
                  const children = getChildren(l2emp.id)
                  return (
                    <div
                      key={l2emp.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0 16px',
                        borderTop: '1px solid var(--border-strong)',
                        paddingTop: '20px',
                        position: 'relative',
                      }}
                    >
                      <OrgNode emp={l2emp} onSelect={setSelectedEmployee} />

                      {children.length > 0 && (
                        <>
                          <VerticalLine />
                          <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start' }}>
                            {children.map((child) => (
                              <div
                                key={child.id}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  padding: '0 10px',
                                  borderTop: '1px solid var(--border-strong)',
                                  paddingTop: '18px',
                                }}
                              >
                                <OrgNode emp={child} onSelect={setSelectedEmployee} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
              <div style={{ position: 'relative', width: isMobile ? '100%' : undefined, flex: isMobile ? undefined : '1 1 200px', maxWidth: isMobile ? undefined : '280px' }}>
                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  placeholder="بحث بالاسم أو المسمى..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingRight: '30px' }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>القسم:</span>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>المسمى:</span>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Top color strip */}
                  <div style={{ height: '6px', background: roleColor(emp.role) }} />

                  {/* Photo + info */}
                  <div style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img
                      src="/employee_placeholder.png"
                      alt={emp.name}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', marginBottom: 12 }}
                    />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>{emp.role}</div>
                    <div style={{ marginTop: 8 }}>
                      <Badge text={emp.department} variant={deptVariant(emp.department)} />
                    </div>
                  </div>

                  {/* Contact info */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <a href={`mailto:${emp.email}`} style={{ fontSize: '12px', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <Mail size={12} /> {emp.email}
                    </a>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} /> {emp.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Employee Panel */}
      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 200,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            width: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <button
            onClick={() => setSelectedEmployee(null)}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--neutral-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)',
            }}>
              {getInitials(selectedEmployee.name)}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedEmployee.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedEmployee.role}
              </div>
            </div>
            <Badge text={selectedEmployee.department} variant={deptVariant(selectedEmployee.department)} />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href={`mailto:${selectedEmployee.email}`}
              style={{ fontSize: '13px', color: 'var(--gold-dark)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Mail size={13} /> {selectedEmployee.email}
            </a>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Phone size={13} /> {selectedEmployee.phone}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
