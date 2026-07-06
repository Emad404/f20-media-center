'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { hilalMatches, leaderboard } from '@/data/predictions'
import { formatArabicDate } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'

type Prediction = { home: string; away: string; name: string }

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '7px 10px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
}

export default function PredictionsPage() {
  const isMobile = useIsMobile()
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [forms, setForms] = useState<Record<number, { home: string; away: string; name: string }>>(
    Object.fromEntries(hilalMatches.map((m) => [m.id, { home: '0', away: '0', name: '' }]))
  )

  function handleSubmit(matchId: number) {
    const f = forms[matchId]
    if (!f.name.trim()) return
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { home: f.home, away: f.away, name: f.name.trim() },
    }))
  }

  function clearPrediction(matchId: number) {
    setPredictions((prev) => {
      const next = { ...prev }
      delete next[matchId]
      return next
    })
  }

  function updateForm(matchId: number, field: keyof typeof forms[number], value: string) {
    setForms((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }))
  }

  return (
    <div>
      <PageHeader
        title="توقعات مباريات الهلال"
        subtitle="توقّع النتيجة الصحيحة وفُز بهدية 🎁"
      />

      <div style={{ padding: isMobile ? '16px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Match cards */}
        {hilalMatches.map((match) => {
          const pred = predictions[match.id]
          const form = forms[match.id]
          const hilalIsHome = match.homeTeam === 'الهلال'
          const hilalIsAway = match.awayTeam === 'الهلال'

          return (
            <div
              key={match.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: isMobile ? '14px 16px' : '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Teams */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: hilalIsHome ? 700 : 500,
                    color: hilalIsHome ? 'var(--gold)' : 'var(--text-primary)',
                  }}
                >
                  {match.homeTeam}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>VS</span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: hilalIsAway ? 700 : 500,
                    color: hilalIsAway ? 'var(--gold)' : 'var(--text-primary)',
                  }}
                >
                  {match.awayTeam}
                </span>
              </div>

              {/* Meta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <Badge text={match.league} variant="neutral" />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatArabicDate(match.date)}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>· {match.venue}</span>
              </div>

              {/* Prediction form or result */}
              {!pred ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    placeholder="اسمك"
                    value={form.name}
                    onChange={(e) => updateForm(match.id, 'name', e.target.value)}
                    style={{ ...inputStyle, maxWidth: '150px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={form.home}
                    onChange={(e) => updateForm(match.id, 'home', e.target.value)}
                    style={{ ...inputStyle, maxWidth: '60px', textAlign: 'center', minHeight: '44px' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={form.away}
                    onChange={(e) => updateForm(match.id, 'away', e.target.value)}
                    style={{ ...inputStyle, maxWidth: '60px', textAlign: 'center', minHeight: '44px' }}
                  />
                  <button
                    onClick={() => handleSubmit(match.id)}
                    style={{
                      background: 'var(--gold)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    سجّل توقعي
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'var(--success-bg)',
                    borderRadius: '8px',
                    padding: '10px 16px',
                  }}
                >
                  <span style={{ color: 'var(--success-text)', fontSize: '18px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'var(--success-text)', fontWeight: 500 }}>
                    توقعك: {pred.home} : {pred.away}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--success-text)' }}>— {pred.name}</span>
                  <button
                    onClick={() => clearPrediction(match.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-dark)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '0',
                      marginRight: '4px',
                    }}
                  >
                    تعديل
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Leaderboard */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginTop: '8px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 4 }}>🏆 المتصدرون</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4, marginBottom: '16px' }}>عدد التوقعات الصحيحة من إجمالي التوقعات المقدمة</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['المركز', 'الموظف', 'التوقعات الصحيحة', 'عدد التوقعات'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'right',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-page)',
                      display: isMobile && h === 'المركز' ? 'none' : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.rank}
                  style={{
                    background: entry.rank === 1 ? 'var(--gold-light)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid var(--border)', display: isMobile ? 'none' : undefined }}>
                    {entry.rank === 1 ? '🥇' : entry.rank}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontWeight: entry.rank === 1 ? 600 : 400, borderBottom: '1px solid var(--border)' }}>
                    {isMobile && entry.rank === 1 ? '🥇 ' : ''}{entry.employeeName}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border)' }}>
                    {entry.correctPredictions}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: isMobile ? '13px' : '14px', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border)' }}>
                    {entry.totalPredictions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
