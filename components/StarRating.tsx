'use client'

interface StarRatingProps {
  value: number
  max?: number
}

export default function StarRating({ value, max = 5 }: StarRatingProps) {
  return (
    <span style={{ color: 'var(--gold)', fontSize: '14px', letterSpacing: '1px' }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < value ? '★' : '☆'}</span>
      ))}
    </span>
  )
}
