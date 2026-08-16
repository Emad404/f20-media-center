'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarDays, MapPin, Gift } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface MatchRow {
  id: string
  opponent_ar: string
  opponent_en: string | null
  match_date: string | null
  match_time: string | null
  stadium_ar: string | null
  stadium_en: string | null
  region: string | null
  hilal_score: number | null
  opponent_score: number | null
  gift_description_ar: string | null
  gift_description_en: string | null
  created_at: string
}

interface PredictionRow {
  id: string
  match_id: string
  employee_id: string
  predicted_hilal_score: number
  predicted_opponent_score: number
  submitted_at: string | null
  points: number | null
}

interface LeaderboardEntry {
  employee_id: string | null
  full_name_ar: string | null
  full_name_en: string | null
  correct_predictions: number | null
  total_predictions: number | null
  total_points: number | null
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type MatchForm = {
  opponent_ar: string
  opponent_en: string
  match_date: string
  match_time: string
  stadium_ar: string
  stadium_en: string
  region: string
  gift_description_ar: string
  gift_description_en: string
  hilal_score: string
  opponent_score: string
}

const emptyMatchForm: MatchForm = {
  opponent_ar: '',
  opponent_en: '',
  match_date: '',
  match_time: '19:00',
  stadium_ar: '',
  stadium_en: '',
  region: '',
  gift_description_ar: '',
  gift_description_en: '',
  hilal_score: '',
  opponent_score: '',
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

function matchDateTime(m: MatchRow): number | null {
  if (!m.match_date) return null
  const time = m.match_time || '00:00:00'
  const dt = new Date(`${m.match_date}T${time}`)
  return isNaN(dt.getTime()) ? null : dt.getTime()
}

function SectionCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: subtitle ? 4 : 16 }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#000A46' }}>{title}</h2>
        {action}
      </div>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{subtitle}</p>}
      {children}
    </div>
  )
}

export default function PredictionsPage() {
  const t = useTranslations('Predictions')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManageMatches = profile?.role === 'developer' || profile?.role === 'media_manager'

  const [loading, setLoading] = useState(true)
  const [nextMatch, setNextMatch] = useState<MatchRow | null>(null)
  const [featuredMatch, setFeaturedMatch] = useState<MatchRow | null>(null)
  const [allPredictions, setAllPredictions] = useState<PredictionRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [historyMatches, setHistoryMatches] = useState<MatchRow[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  const [predForm, setPredForm] = useState({ hilal: '0', opponent: '0' })
  const [predSaving, setPredSaving] = useState(false)
  const [predError, setPredError] = useState('')
  const [editingPredictionId, setEditingPredictionId] = useState<string | null>(null)
  const [dataAsOf, setDataAsOf] = useState(0)

  const [allMatches, setAllMatches] = useState<MatchRow[]>([])
  const [adminLoading, setAdminLoading] = useState(true)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<MatchRow | null>(null)
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm)
  const [matchSaving, setMatchSaving] = useState(false)
  const [matchSaveError, setMatchSaveError] = useState('')
  const [deleteWarning, setDeleteWarning] = useState<{ match: MatchRow; count: number } | null>(null)
  const [deletingMatch, setDeletingMatch] = useState(false)

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const displayOpponent = (m: MatchRow) => (locale === 'en' && m.opponent_en ? m.opponent_en : m.opponent_ar)
  const displayStadium = (m: MatchRow) => ((locale === 'en' && m.stadium_en ? m.stadium_en : m.stadium_ar) || '')
  const displayGift = (m: MatchRow) => ((locale === 'en' && m.gift_description_en ? m.gift_description_en : m.gift_description_ar) || '')
  const displayEmployeeName = (e: LeaderboardEntry) => ((locale === 'en' && e.full_name_en ? e.full_name_en : e.full_name_ar) || '')

  const fetchPredictionsData = async () => {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [candidatesRes, featuredRes, predictionsRes, profilesRes, leaderboardRes] = await Promise.all([
      supabase
        .from('hilal_matches')
        .select('*')
        .not('match_date', 'is', null)
        .gte('match_date', todayStr)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(10),
      supabase.from('hilal_matches').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('match_predictions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name_ar,full_name_en'),
      supabase.from('leaderboard').select('*'),
    ])

    const candidates = (candidatesRes.data || []) as MatchRow[]
    const now = Date.now()
    setDataAsOf(now)
    const future = candidates
      .filter((m) => {
        const dt = matchDateTime(m)
        return dt !== null && dt > now
      })
      .sort((a, b) => matchDateTime(a)! - matchDateTime(b)!)
    const next = future[0] || null
    setNextMatch(next)
    setFeaturedMatch((featuredRes.data as MatchRow | null) || null)

    const allPreds = (predictionsRes.data || []) as PredictionRow[]
    setAllPredictions(allPreds)
    setProfiles((profilesRes.data || []) as ProfileLite[])

    const myPreds = profile ? allPreds.filter((p) => p.employee_id === profile.id) : []
    const historyIds = Array.from(new Set(myPreds.map((p) => p.match_id))).filter((id) => id !== next?.id)
    if (historyIds.length > 0) {
      const { data: historyData } = await supabase.from('hilal_matches').select('*').in('id', historyIds)
      setHistoryMatches((historyData || []) as MatchRow[])
    } else {
      setHistoryMatches([])
    }

    setLeaderboard((leaderboardRes.data || []) as LeaderboardEntry[])
    setLoading(false)
  }

  const fetchAdminMatches = async () => {
    setAdminLoading(true)
    const { data } = await supabase.from('hilal_matches').select('*').order('match_date', { ascending: false })
    setAllMatches((data || []) as MatchRow[])
    setAdminLoading(false)
  }

  useEffect(() => {
    fetchPredictionsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  useEffect(() => {
    if (canManageMatches) fetchAdminMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageMatches])

  const matchesById = useMemo(() => {
    const map = new Map<string, MatchRow>()
    if (nextMatch) map.set(nextMatch.id, nextMatch)
    if (featuredMatch) map.set(featuredMatch.id, featuredMatch)
    for (const m of historyMatches) map.set(m.id, m)
    for (const m of allMatches) map.set(m.id, m)
    return map
  }, [nextMatch, featuredMatch, historyMatches, allMatches])

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const displayPredictorName = (employeeId: string) => {
    const p = profilesById.get(employeeId)
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const myPredictions = useMemo(
    () => (profile ? allPredictions.filter((p) => p.employee_id === profile.id) : []),
    [allPredictions, profile]
  )

  const nextMatchPredictions = useMemo(
    () => (nextMatch ? allPredictions.filter((p) => p.match_id === nextMatch.id) : []),
    [allPredictions, nextMatch]
  )

  const featuredMatchPredictions = useMemo(
    () => (featuredMatch ? allPredictions.filter((p) => p.match_id === featuredMatch.id) : []),
    [allPredictions, featuredMatch]
  )

  const myNextMatchPrediction = nextMatch ? nextMatchPredictions.find((p) => p.employee_id === profile?.id) || null : null
  const nextMatchStartTime = nextMatch ? matchDateTime(nextMatch) : null
  const nextMatchStarted = nextMatchStartTime !== null && dataAsOf !== 0 && nextMatchStartTime <= dataAsOf

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      const pointsDiff = (b.total_points || 0) - (a.total_points || 0)
      if (pointsDiff !== 0) return pointsDiff
      return (b.correct_predictions || 0) - (a.correct_predictions || 0)
    })
  }, [leaderboard])

  const validatePrediction = (hilal: number, opponent: number): string | null => {
    if (!Number.isInteger(hilal) || hilal < 0 || !Number.isInteger(opponent) || opponent < 0) {
      return t('predictionErrorMessage')
    }
    if (opponent > hilal) {
      return t('hilalLossRejectionMessage')
    }
    return null
  }

  const handleSubmitPrediction = async () => {
    if (!nextMatch || !profile) return
    const hilal = Number(predForm.hilal)
    const opponent = Number(predForm.opponent)
    const validationError = validatePrediction(hilal, opponent)
    if (validationError) {
      setPredError(validationError)
      return
    }
    setPredSaving(true)
    setPredError('')
    const { error } = await supabase.from('match_predictions').insert({
      match_id: nextMatch.id,
      employee_id: profile.id,
      predicted_hilal_score: hilal,
      predicted_opponent_score: opponent,
    })
    setPredSaving(false)
    if (error) {
      setPredError(error.message)
      return
    }
    setPredForm({ hilal: '0', opponent: '0' })
    await fetchPredictionsData()
    flashSuccess(t('predictionSuccess'))
  }

  const startEditPrediction = (pred: PredictionRow) => {
    setEditingPredictionId(pred.id)
    setPredForm({ hilal: String(pred.predicted_hilal_score), opponent: String(pred.predicted_opponent_score) })
    setPredError('')
  }

  const cancelEditPrediction = () => {
    setEditingPredictionId(null)
    setPredForm({ hilal: '0', opponent: '0' })
    setPredError('')
  }

  const handleSaveEditedPrediction = async () => {
    if (!editingPredictionId) return
    const hilal = Number(predForm.hilal)
    const opponent = Number(predForm.opponent)
    const validationError = validatePrediction(hilal, opponent)
    if (validationError) {
      setPredError(validationError)
      return
    }
    setPredSaving(true)
    setPredError('')
    const { error } = await supabase
      .from('match_predictions')
      .update({ predicted_hilal_score: hilal, predicted_opponent_score: opponent })
      .eq('id', editingPredictionId)
    setPredSaving(false)
    if (error) {
      setPredError(error.message)
      return
    }
    setEditingPredictionId(null)
    setPredForm({ hilal: '0', opponent: '0' })
    await fetchPredictionsData()
    flashSuccess(t('savePredictionSuccess'))
  }

  const handleDeletePrediction = async (pred: PredictionRow) => {
    if (!window.confirm(t('deletePredictionConfirm'))) return
    const { error } = await supabase.from('match_predictions').delete().eq('id', pred.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchPredictionsData()
    flashSuccess(t('deletePredictionSuccess'))
  }

  const openAddMatchModal = () => {
    setEditingMatch(null)
    setMatchForm(emptyMatchForm)
    setMatchSaveError('')
    setIsMatchModalOpen(true)
  }

  const openEditMatchModal = (m: MatchRow) => {
    setEditingMatch(m)
    setMatchForm({
      opponent_ar: m.opponent_ar || '',
      opponent_en: m.opponent_en || '',
      match_date: m.match_date || '',
      match_time: m.match_time ? m.match_time.slice(0, 5) : '19:00',
      stadium_ar: m.stadium_ar || '',
      stadium_en: m.stadium_en || '',
      region: m.region || '',
      gift_description_ar: m.gift_description_ar || '',
      gift_description_en: m.gift_description_en || '',
      hilal_score: m.hilal_score != null ? String(m.hilal_score) : '',
      opponent_score: m.opponent_score != null ? String(m.opponent_score) : '',
    })
    setMatchSaveError('')
    setIsMatchModalOpen(true)
  }

  const closeMatchModal = () => {
    setIsMatchModalOpen(false)
    setEditingMatch(null)
    setMatchSaveError('')
  }

  const handleSaveMatch = async () => {
    if (!matchForm.opponent_ar.trim()) {
      setMatchSaveError(t('opponentArRequiredError'))
      return
    }

    const payload = {
      opponent_ar: matchForm.opponent_ar.trim(),
      opponent_en: matchForm.opponent_en.trim() || null,
      match_date: matchForm.match_date || null,
      match_time: matchForm.match_time || null,
      stadium_ar: matchForm.stadium_ar.trim() || null,
      stadium_en: matchForm.stadium_en.trim() || null,
      region: matchForm.region.trim() || null,
      gift_description_ar: matchForm.gift_description_ar.trim() || null,
      gift_description_en: matchForm.gift_description_en.trim() || null,
      hilal_score: matchForm.hilal_score !== '' ? Number(matchForm.hilal_score) : null,
      opponent_score: matchForm.opponent_score !== '' ? Number(matchForm.opponent_score) : null,
    }

    setMatchSaving(true)
    setMatchSaveError('')

    const { error } = editingMatch
      ? await supabase.from('hilal_matches').update(payload).eq('id', editingMatch.id)
      : await supabase.from('hilal_matches').insert(payload)

    setMatchSaving(false)
    if (error) {
      setMatchSaveError(error.message)
      return
    }
    closeMatchModal()
    await Promise.all([fetchAdminMatches(), fetchPredictionsData()])
    flashSuccess(editingMatch ? t('saveMatchSuccess') : t('addMatchSuccess'))
  }

  const performDeleteMatch = async (m: MatchRow) => {
    const { error: predError } = await supabase.from('match_predictions').delete().eq('match_id', m.id)
    if (predError) {
      window.alert(predError.message)
      return false
    }
    const { error } = await supabase.from('hilal_matches').delete().eq('id', m.id)
    if (error) {
      window.alert(error.message)
      return false
    }
    await Promise.all([fetchAdminMatches(), fetchPredictionsData()])
    flashSuccess(t('deleteMatchSuccess'))
    return true
  }

  const handleDeleteMatch = async (m: MatchRow) => {
    const { count, error: countError } = await supabase
      .from('match_predictions')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', m.id)
    if (countError) {
      window.alert(countError.message)
      return
    }
    if (!count) {
      if (!window.confirm(t('deleteConfirm', { opponent: displayOpponent(m) }))) return
      await performDeleteMatch(m)
      return
    }
    setDeleteWarning({ match: m, count })
  }

  const handleConfirmDeleteWithPredictions = async () => {
    if (!deleteWarning) return
    setDeletingMatch(true)
    const ok = await performDeleteMatch(deleteWarning.match)
    setDeletingMatch(false)
    if (ok) setDeleteWarning(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0422BA', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title={t('pageTitle')} subtitle={t('subtitle')} centerLogo={{ src: '/hilal-logo.png', alt: t('hilalName') }} />

      <div style={{ padding: isMobile ? '16px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px', direction: isRtl ? 'rtl' : 'ltr', flex: 1 }}>
        {successMessage && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '13px' }}>
            {successMessage}
          </div>
        )}

        {/* Developer / media_manager match management */}
        {canManageMatches && (
          <SectionCard
            title={t('manageMatchesTitle')}
            action={
              <button
                onClick={openAddMatchModal}
                style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {t('addMatchButton')}
              </button>
            }
          >
            {adminLoading ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('loading')}</p>
            ) : allMatches.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noMatchesMessage')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allMatches.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{t('hilalName')} {t('vsShort')} {displayOpponent(m)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {m.match_date ? formatArabicDate(m.match_date, locale) : t('dateNotSet')}
                        {m.match_time ? ` — ${m.match_time.slice(0, 5)}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge
                        text={m.hilal_score != null && m.opponent_score != null ? `${m.hilal_score} : ${m.opponent_score}` : t('scoreNotEnteredText')}
                        variant={m.hilal_score != null && m.opponent_score != null ? 'info' : 'neutral'}
                      />
                      <PersonCardMenu
                        isRtl={isRtl}
                        optionsAria={t('optionsAria')}
                        editLabel={t('editAria')}
                        deleteLabel={t('deleteAria')}
                        onEdit={() => openEditMatchModal(m)}
                        onDelete={() => handleDeleteMatch(m)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Next match + prediction */}
        <SectionCard title={t('nextMatchTitle')}>
          {loading ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('loading')}</p>
          ) : !nextMatch ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noUpcomingMatchMessage')}</p>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#0028F0' }}>{t('hilalName')}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>VS</span>
                <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>{displayOpponent(nextMatch)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {nextMatch.match_date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#000000' }}>
                    <CalendarDays size={13} />
                    {formatArabicDate(nextMatch.match_date, locale)}{nextMatch.match_time ? ` — ${nextMatch.match_time.slice(0, 5)}` : ''}
                  </span>
                )}
                {displayStadium(nextMatch) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#000000' }}>
                    <MapPin size={13} />
                    {displayStadium(nextMatch)}{nextMatch.region ? ` · ${nextMatch.region}` : ''}
                  </span>
                )}
                {displayGift(nextMatch) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#000000' }}>
                    <Gift size={13} />
                    {displayGift(nextMatch)}
                  </span>
                )}
              </div>

              {myNextMatchPrediction && editingPredictionId !== myNextMatchPrediction.id ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--info-bg)', borderRadius: '8px', padding: '10px 16px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--info-text)', fontSize: '18px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'var(--info-text)', fontWeight: 500 }}>
                    {t('yourPredictionLabel')} {myNextMatchPrediction.predicted_hilal_score} : {myNextMatchPrediction.predicted_opponent_score}
                  </span>
                  {!nextMatchStarted && (
                    <PersonCardMenu
                      isRtl={isRtl}
                      optionsAria={t('optionsAria')}
                      editLabel={t('editAria')}
                      deleteLabel={t('deleteAria')}
                      onEdit={() => startEditPrediction(myNextMatchPrediction)}
                      onDelete={() => handleDeletePrediction(myNextMatchPrediction)}
                    />
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  {predError && <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{predError}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('hilalName')}</span>
                    <input
                      type="number"
                      min="0"
                      value={predForm.hilal}
                      onChange={(e) => setPredForm((f) => ({ ...f, hilal: e.target.value }))}
                      style={{ ...inputStyle, maxWidth: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>:</span>
                    <input
                      type="number"
                      min="0"
                      value={predForm.opponent}
                      onChange={(e) => setPredForm((f) => ({ ...f, opponent: e.target.value }))}
                      style={{ ...inputStyle, maxWidth: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayOpponent(nextMatch)}</span>
                    <button
                      onClick={editingPredictionId ? handleSaveEditedPrediction : handleSubmitPrediction}
                      disabled={predSaving}
                      style={{
                        background: 'var(--btn-bg)',
                        color: 'var(--btn-text)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: predSaving ? 'not-allowed' : 'pointer',
                        opacity: predSaving ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {predSaving ? t('submitting') : editingPredictionId ? t('saveButtonEdit') : t('submitPredictionButton')}
                    </button>
                    {editingPredictionId && (
                      <button
                        onClick={cancelEditPrediction}
                        disabled={predSaving}
                        style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 500, cursor: predSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {t('cancelButton')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* All employees' predictions for the most recently added match */}
        <SectionCard
          title={t('employeePredictionsTitle')}
          subtitle={featuredMatch ? `${t('hilalName')} ${t('vsShort')} ${displayOpponent(featuredMatch)}${featuredMatch.match_date ? ` — ${formatArabicDate(featuredMatch.match_date, locale)}` : ''}` : undefined}
        >
          {loading ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('loading')}</p>
          ) : !featuredMatch ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noMatchesMessage')}</p>
          ) : featuredMatchPredictions.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noEmployeePredictionsMessage')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {featuredMatchPredictions.map((pred) => (
                <div key={pred.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{displayPredictorName(pred.employee_id)}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {pred.predicted_hilal_score} : {pred.predicted_opponent_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Personal history */}
        <SectionCard title={t('historyTitle')}>
          {myPredictions.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noHistoryMessage')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myPredictions.map((pred) => {
                const match = matchesById.get(pred.match_id)
                const hasResult = match && match.hilal_score != null && match.opponent_score != null
                const isCorrect = hasResult && match!.hilal_score === pred.predicted_hilal_score && match!.opponent_score === pred.predicted_opponent_score
                return (
                  <div key={pred.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>
                        {t('hilalName')} {match ? `${t('vsShort')} ${displayOpponent(match)}` : ''}
                      </div>
                      {match?.match_date && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatArabicDate(match.match_date, locale)}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {t('yourPredictionLabel')} {pred.predicted_hilal_score} : {pred.predicted_opponent_score}
                      </span>
                      {hasResult ? (
                        <>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {t('actualResultLabel')} {match!.hilal_score} : {match!.opponent_score}
                          </span>
                          <Badge text={isCorrect ? t('correctLabel') : t('incorrectLabel')} variant={isCorrect ? 'success' : 'danger'} />
                        </>
                      ) : (
                        <Badge text={t('resultPendingLabel')} variant="neutral" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Leaderboard */}
        <SectionCard title={t('leaderboardTitle')} subtitle={t('leaderboardSubtitle')}>
          {sortedLeaderboard.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>{t('noLeaderboardMessage')}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { id: 'rank', label: t('rankHeader') },
                    { id: 'employee', label: t('employeeHeader') },
                    { id: 'points', label: t('pointsHeader') },
                    { id: 'correct', label: t('correctPredictionsHeader') },
                    { id: 'total', label: t('totalPredictionsHeader') },
                  ].map((h) => (
                    <th
                      key={h.id}
                      style={{
                        textAlign: isRtl ? 'right' : 'left',
                        padding: '10px 16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-page)',
                        display: isMobile && h.id === 'rank' ? 'none' : undefined,
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, idx) => {
                  const rank = idx + 1
                  return (
                    <tr key={entry.employee_id || idx} style={{ background: rank === 1 ? '#D2D2D2' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid var(--border)', display: isMobile ? 'none' : undefined }}>
                        {rank === 1 ? '🥇' : rank}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontWeight: rank === 1 ? 600 : 400, borderBottom: '1px solid var(--border)' }}>
                        {isMobile && rank === 1 ? '🥇 ' : ''}{displayEmployeeName(entry)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border)' }}>
                        {entry.total_points ?? 0}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border)' }}>
                        {entry.correct_predictions ?? 0}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border)' }}>
                        {entry.total_predictions ?? 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      {/* Add / Edit Match Modal (developer only) */}
      <Modal isOpen={isMatchModalOpen} onClose={closeMatchModal} title={editingMatch ? t('editMatchModalTitle') : t('addMatchModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {matchSaveError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
              {matchSaveError}
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('opponentArLabel')}</label>
            <input dir="rtl" value={matchForm.opponent_ar} onChange={(e) => setMatchForm((f) => ({ ...f, opponent_ar: e.target.value }))} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>{t('opponentEnLabel')}</label>
            <input dir="ltr" value={matchForm.opponent_en} onChange={(e) => setMatchForm((f) => ({ ...f, opponent_en: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('matchDateLabel')}</label>
              <input type="date" value={matchForm.match_date} onChange={(e) => setMatchForm((f) => ({ ...f, match_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('matchTimeLabel')}</label>
              <input type="time" value={matchForm.match_time} onChange={(e) => setMatchForm((f) => ({ ...f, match_time: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('stadiumArLabel')}</label>
            <input dir="rtl" value={matchForm.stadium_ar} onChange={(e) => setMatchForm((f) => ({ ...f, stadium_ar: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('stadiumEnLabel')}</label>
            <input dir="ltr" value={matchForm.stadium_en} onChange={(e) => setMatchForm((f) => ({ ...f, stadium_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('regionLabel')}</label>
            <input dir={isRtl ? 'rtl' : 'ltr'} value={matchForm.region} onChange={(e) => setMatchForm((f) => ({ ...f, region: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('giftDescriptionArLabel')}</label>
            <input dir="rtl" value={matchForm.gift_description_ar} onChange={(e) => setMatchForm((f) => ({ ...f, gift_description_ar: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('giftDescriptionEnLabel')}</label>
            <input dir="ltr" value={matchForm.gift_description_en} onChange={(e) => setMatchForm((f) => ({ ...f, gift_description_en: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('finalHilalScoreLabel')}</label>
              <input type="number" min="0" value={matchForm.hilal_score} onChange={(e) => setMatchForm((f) => ({ ...f, hilal_score: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('finalOpponentScoreLabel')}</label>
              <input type="number" min="0" value={matchForm.opponent_score} onChange={(e) => setMatchForm((f) => ({ ...f, opponent_score: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSaveMatch}
              disabled={matchSaving}
              style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: matchSaving ? 'not-allowed' : 'pointer', opacity: matchSaving ? 0.7 : 1 }}
            >
              {matchSaving ? t('saving') : editingMatch ? t('saveButtonEdit') : t('saveButton')}
            </button>
            <button
              onClick={closeMatchModal}
              style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete match with existing predictions - distinct warning, explicit Delete button */}
      <Modal isOpen={!!deleteWarning} onClose={() => setDeleteWarning(null)} title={t('deleteMatchWarningTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, textAlign: isRtl ? 'right' : 'left' }}>
            {deleteWarning && t('deleteMatchWarningMessage', { count: deleteWarning.count })}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleConfirmDeleteWithPredictions}
              disabled={deletingMatch}
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: deletingMatch ? 'not-allowed' : 'pointer', opacity: deletingMatch ? 0.7 : 1 }}
            >
              {deletingMatch ? t('saving') : t('confirmDeleteButton')}
            </button>
            <button
              onClick={() => setDeleteWarning(null)}
              disabled={deletingMatch}
              style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: deletingMatch ? 'not-allowed' : 'pointer' }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
