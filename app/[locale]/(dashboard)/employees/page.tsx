'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { X, Mail, Phone, Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import PersonCard from '@/components/PersonCard'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { useIsMobile } from '@/hooks/useIsMobile'

const ALL = '__all__'
const MANAGE_ROLES = ['developer', 'ceo']
const ROLE_VALUES = ['ceo', 'project_manager', 'developer', 'media_manager', 'PR_manager', 'Trainee'] as const

interface EmployeeProfile {
  id: string
  email: string
  full_name_ar: string
  full_name_en: string | null
  role: string
  job_title_ar: string | null
  job_title_en: string | null
  department_ar: string | null
  department_en: string | null
  phone: string | null
  profile_image_url: string | null
  created_at: string
}

type EmployeeForm = {
  full_name_ar: string
  full_name_en: string
  email: string
  phone: string
  role: string
  customRole: string
  job_title_ar: string
  job_title_en: string
  department_ar: string
  department_en: string
}

const emptyForm: EmployeeForm = {
  full_name_ar: '',
  full_name_en: '',
  email: '',
  phone: '',
  role: 'Trainee',
  customRole: '',
  job_title_ar: '',
  job_title_en: '',
  department_ar: '',
  department_en: '',
}

// Standing sort: CEO first, Project Manager second, everyone else after.
function roleRank(role: string): number {
  if (role === 'ceo') return 0
  if (role === 'project_manager') return 1
  return 2
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2)
  return words[0][0] + words[words.length - 1][0]
}

function roleLabel(t: (key: string) => string, role: string): string {
  switch (role) {
    case 'ceo': return t('roleCeo')
    case 'project_manager': return t('roleProjectManager')
    case 'developer': return t('roleDeveloper')
    case 'media_manager': return t('roleMediaManager')
    case 'PR_manager': return t('rolePrManager')
    case 'Trainee': return t('roleTrainee')
    default: return role
  }
}

export default function EmployeesPage() {
  const t = useTranslations('Employees')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && MANAGE_ROLES.includes(profile.role)

  const [view, setView] = useState<'org' | 'list'>('list')
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState(ALL)
  const [roleFilter, setRoleFilter] = useState(ALL)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchEmployees = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*')
    setEmployees(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const displayName = (e: EmployeeProfile) => (locale === 'en' && e.full_name_en ? e.full_name_en : e.full_name_ar)
  const displayJobTitle = (e: EmployeeProfile) => ((locale === 'en' && e.job_title_en ? e.job_title_en : e.job_title_ar) || '')
  const displayDept = (e: EmployeeProfile) => ((locale === 'en' && e.department_en ? e.department_en : e.department_ar) || '')

  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map(displayDept).filter(Boolean)))
    return [ALL, ...depts]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, locale])

  const roles = useMemo(() => {
    const rs = Array.from(new Set(employees.map((e) => e.role)))
    return [ALL, ...rs]
  }, [employees])

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e) => deptFilter === ALL || displayDept(e) === deptFilter)
      .filter((e) => roleFilter === ALL || e.role === roleFilter)
      .filter((e) => {
        if (search === '') return true
        return displayName(e).includes(search) || displayJobTitle(e).includes(search)
      })
      .sort((a, b) => {
        const rankDiff = roleRank(a.role) - roleRank(b.role)
        if (rankDiff !== 0) return rankDiff
        return displayName(a).localeCompare(displayName(b), locale)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, search, deptFilter, roleFilter, locale])

  const openAddModal = () => {
    setEditingEmployee(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (emp: EmployeeProfile) => {
    setEditingEmployee(emp)
    const isFixedRole = (ROLE_VALUES as readonly string[]).includes(emp.role)
    setForm({
      full_name_ar: emp.full_name_ar || '',
      full_name_en: emp.full_name_en || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: isFixedRole ? emp.role : 'custom',
      customRole: isFixedRole ? '' : emp.role,
      job_title_ar: emp.job_title_ar || '',
      job_title_en: emp.job_title_en || '',
      department_ar: emp.department_ar || '',
      department_en: emp.department_en || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.full_name_ar.trim()) {
      setSaveError(t('fullNameRequiredError'))
      return
    }

    const resolvedRole = form.role === 'custom' ? form.customRole.trim() : form.role
    if (!resolvedRole) {
      setSaveError(t('roleRequiredError'))
      return
    }

    if (editingEmployee) {
      setSaving(true)
      setSaveError('')
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name_ar: form.full_name_ar,
          full_name_en: form.full_name_en || null,
          phone: form.phone || null,
          role: resolvedRole,
          job_title_ar: form.job_title_ar || null,
          job_title_en: form.job_title_en || null,
          department_ar: form.department_ar || null,
          department_en: form.department_en || null,
        })
        .eq('id', editingEmployee.id)

      setSaving(false)
      if (error) {
        setSaveError(error.message)
        return
      }
      closeModal()
      await fetchEmployees()
      flashSuccess(t('saveSuccess'))
      return
    }

    if (!form.email.trim()) {
      setSaveError(t('emailRequiredError'))
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          full_name_ar: form.full_name_ar,
          full_name_en: form.full_name_en || null,
          role: resolvedRole,
          job_title_ar: form.job_title_ar || null,
          job_title_en: form.job_title_en || null,
          department_ar: form.department_ar || null,
          department_en: form.department_en || null,
          phone: form.phone || null,
        }),
      })
      const json = await res.json()
      setSaving(false)
      if (!res.ok) {
        setSaveError(json.error || t('saveError'))
        return
      }
      closeModal()
      await fetchEmployees()
      flashSuccess(t('inviteSuccess'))
    } catch {
      setSaving(false)
      setSaveError(t('saveError'))
    }
  }

  const handleDelete = async (emp: EmployeeProfile) => {
    if (!window.confirm(t('deleteConfirm', { name: displayName(emp) }))) return
    try {
      const res = await fetch('/api/employees/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        window.alert(json.error || t('saveError'))
        return
      }
      if (selectedEmployee?.id === emp.id) setSelectedEmployee(null)
      await fetchEmployees()
      flashSuccess(t('deleteSuccess'))
    } catch {
      window.alert(t('saveError'))
    }
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

  const orgButton = (
    <button
      key="org"
      onClick={() => setView('org')}
      style={{
        padding: '7px 14px',
        borderRadius: '8px',
        border: '1px solid',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        background: view === 'org' ? 'var(--btn-bg)' : 'transparent',
        borderColor: view === 'org' ? 'var(--btn-bg)' : 'var(--border-strong)',
        color: view === 'org' ? 'var(--btn-text)' : 'var(--text-secondary)',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      {t('orgViewButton')}
    </button>
  )

  const listButton = (
    <button
      key="list"
      onClick={() => setView('list')}
      style={{
        padding: '7px 14px',
        borderRadius: '8px',
        border: '1px solid',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        background: view === 'list' ? 'var(--btn-bg)' : 'transparent',
        borderColor: view === 'list' ? 'var(--btn-bg)' : 'var(--border-strong)',
        color: view === 'list' ? 'var(--btn-text)' : 'var(--text-secondary)',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      {t('listViewButton')}
    </button>
  )

  const addButton = canManage ? (
    <button
      key="add"
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
      {t('addButton')}
    </button>
  ) : null

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
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Employee List comes before Org Chart in both locales - the parent
              row already sets an explicit `direction` per locale, so this
              code order is mirrored correctly without an isRtl branch. */}
          {listButton}
          {orgButton}
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
        ) : employees.length === 0 ? (
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('emptyState')}
          </div>
        ) : view === 'org' ? (
          /* ORG CHART - intentionally empty until the company decides the structure to show */
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('orgChartEmptyState')}
          </div>
        ) : (
          /* LIST VIEW */
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
              <div style={{ position: 'relative', width: isMobile ? '100%' : undefined, flex: isMobile ? undefined : '1 1 200px', maxWidth: isMobile ? undefined : '280px' }}>
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
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={isRtl ? { ...inputStyle, paddingRight: '30px' } : { ...inputStyle, paddingLeft: '30px' }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('departmentLabel')}</span>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                {departments.map((d) => <option key={d} value={d}>{d === ALL ? t('allOption') : d}</option>)}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('roleLabel')}</span>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                {roles.map((r) => <option key={r} value={r}>{r === ALL ? t('allOption') : roleLabel(t, r)}</option>)}
              </select>
              {addButton && (
                <div style={{ marginInlineStart: isMobile ? undefined : 'auto', width: isMobile ? '100%' : undefined }}>
                  {addButton}
                </div>
              )}
            </div>

            {filteredEmployees.length === 0 ? (
              <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                {t('emptyState')}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredEmployees.map((emp) => (
                  <PersonCard
                    key={emp.id}
                    name={displayName(emp)}
                    jobTitle={displayJobTitle(emp)}
                    subtitle={displayDept(emp)}
                    email={emp.email}
                    phone={emp.phone}
                    imageUrl={emp.profile_image_url}
                    isRtl={isRtl}
                    menu={canManage ? (
                      <PersonCardMenu
                        isRtl={isRtl}
                        optionsAria={t('optionsAria')}
                        editLabel={t('editAria')}
                        deleteLabel={t('deleteAria')}
                        onEdit={() => openEditModal(emp)}
                        onDelete={() => handleDelete(emp)}
                      />
                    ) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Employee Panel */}
      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            [isRtl ? 'left' : 'right']: '24px',
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
              [isRtl ? 'left' : 'right']: '12px',
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
              {getInitials(displayName(selectedEmployee))}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {displayName(selectedEmployee)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {roleLabel(t, selectedEmployee.role)}
              </div>
            </div>
            {displayDept(selectedEmployee) && <Badge text={displayDept(selectedEmployee)} variant="neutral" />}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href={`mailto:${selectedEmployee.email}`}
              style={{ fontSize: '13px', color: 'var(--gold-dark)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Mail size={13} /> {selectedEmployee.email}
            </a>
            {selectedEmployee.phone && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Phone size={13} /> {selectedEmployee.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee ? t('editModalTitle') : t('addModalTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('fullNameArLabel')}</label>
            <input
              dir="rtl"
              value={form.full_name_ar}
              onChange={(e) => setForm((f) => ({ ...f, full_name_ar: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>{t('fullNameEnLabel')}</label>
            <input
              dir="ltr"
              value={form.full_name_en}
              onChange={(e) => setForm((f) => ({ ...f, full_name_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('emailLabel')}</label>
            <input
              dir="ltr"
              type="email"
              value={form.email}
              disabled={!!editingEmployee}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={editingEmployee ? { ...inputStyle, opacity: 0.6, cursor: 'not-allowed' } : inputStyle}
            />
            {editingEmployee && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('emailReadOnlyNote')}</div>
            )}
          </div>

          <div>
            <label style={labelStyle}>{t('phoneLabel')}</label>
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('roleFieldLabel')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {ROLE_VALUES.map((rv) => (
                <option key={rv} value={rv}>{roleLabel(t, rv)}</option>
              ))}
              <option value="custom">{t('roleCustomOption')}</option>
            </select>
          </div>

          {form.role === 'custom' && (
            <div>
              <label style={labelStyle}>{t('customRoleLabel')}</label>
              <input
                dir={isRtl ? 'rtl' : 'ltr'}
                value={form.customRole}
                onChange={(e) => setForm((f) => ({ ...f, customRole: e.target.value }))}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('jobTitleArLabel')}</label>
            <input
              dir="rtl"
              value={form.job_title_ar}
              onChange={(e) => setForm((f) => ({ ...f, job_title_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('jobTitleEnLabel')}</label>
            <input
              dir="ltr"
              value={form.job_title_en}
              onChange={(e) => setForm((f) => ({ ...f, job_title_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('departmentArLabel')}</label>
            <input
              dir="rtl"
              value={form.department_ar}
              onChange={(e) => setForm((f) => ({ ...f, department_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('departmentEnLabel')}</label>
            <input
              dir="ltr"
              value={form.department_en}
              onChange={(e) => setForm((f) => ({ ...f, department_en: e.target.value }))}
              style={inputStyle}
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
              {saving ? t('saving') : editingEmployee ? t('saveButtonEdit') : t('saveButton')}
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
