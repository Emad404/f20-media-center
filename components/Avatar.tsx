'use client'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizeMap = { sm: 28, md: 36, lg: 44 }
const fontSizeMap = { sm: 10, md: 13, lg: 16 }

const bgColors = [
  '#DBEAFE', '#D1FAE5', '#FEF3C7', '#EDE9FE', '#FCE7F3', '#E0F2FE',
]

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2)
  return words[0][0] + words[words.length - 1][0]
}

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return bgColors[Math.abs(hash) % bgColors.length]
}

const textColors: Record<string, string> = {
  '#DBEAFE': '#1E40AF',
  '#D1FAE5': '#065F46',
  '#FEF3C7': '#78350F',
  '#EDE9FE': '#4C1D95',
  '#FCE7F3': '#831843',
  '#E0F2FE': '#0C4A6E',
}

export default function Avatar({ name, size = 'md', color }: AvatarProps) {
  const px = sizeMap[size]
  const fs = fontSizeMap[size]
  const bg = color ?? hashColor(name)
  const textColor = textColors[bg] ?? '#374151'
  const initials = getInitials(name)

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: bg,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}
