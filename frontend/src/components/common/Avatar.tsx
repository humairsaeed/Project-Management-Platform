import { useState } from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

// Generate consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-emerald-500',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function Avatar({ name, size = 'md', showTooltip = true, className = '' }: AvatarProps) {
  const [showName, setShowName] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }

  const color = getAvatarColor(name)
  const initials = getInitials(name)

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center text-white font-medium cursor-pointer
          transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-white/30 hover:shadow-lg ${className}`}
        onMouseEnter={() => setShowName(true)}
        onMouseLeave={() => setShowName(false)}
      >
        {initials}
      </div>

      {/* Tooltip */}
      {showTooltip && showName && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 animate-fade-in">
          {name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  )
}

// Avatar group for multiple assignees
interface AvatarGroupProps {
  names: string[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarGroup({ names, max = 3, size = 'md' }: AvatarGroupProps) {
  const visibleNames = names.slice(0, max)
  const remaining = names.length - max

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }

  return (
    <div className="flex items-center">
      {visibleNames.map((name, index) => (
        <div
          key={name}
          className={index > 0 ? overlapClasses[size] : ''}
          style={{ zIndex: visibleNames.length - index }}
        >
          <Avatar name={name} size={size} className="ring-2 ring-slate-800" />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={`${overlapClasses[size]} ${sizeClasses[size]} bg-slate-600 rounded-full flex items-center justify-center text-white font-medium ring-2 ring-slate-800`}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
