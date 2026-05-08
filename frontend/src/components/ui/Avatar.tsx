import React from 'react'

interface AvatarProps {
  name: string
  size?: number
  gradient?: [string, string]
  glow?: boolean
  src?: string
  className?: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function nameGradient(name: string): [string, string] {
  const palettes: Array<[string, string]> = [
    ['#f59e0b', '#f97316'],
    ['#6366f1', '#8b5cf6'],
    ['#10b981', '#14b8a6'],
    ['#ef4444', '#f97316'],
    ['#ec4899', '#8b5cf6'],
    ['#06b6d4', '#6366f1'],
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palettes.length
  return palettes[Math.abs(hash)]
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 28, gradient, glow = false, src, className = '' }) => {
  const [from, to] = gradient ?? nameGradient(name)
  const isAmber = from === '#f59e0b'
  const shadow = glow || isAmber ? `0 0 8px ${from}66` : undefined

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, boxShadow: shadow }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: shadow,
        fontSize: Math.max(8, size * 0.35),
        fontFamily: 'var(--font-heading)',
        color: isAmber ? '#000' : '#fff',
      }}
    >
      {initials(name)}
    </div>
  )
}
