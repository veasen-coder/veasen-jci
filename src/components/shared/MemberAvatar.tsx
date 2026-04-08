import type { Member } from '@/lib/supabase/types'

interface MemberAvatarProps {
  member: Member
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const sizeClasses = {
  sm: 'h-[26px] w-[26px] text-[10px]',
  md: 'h-[36px] w-[36px] text-xs',
  lg: 'h-[44px] w-[44px] text-sm',
}

export function MemberAvatar({ member, size = 'md', onClick }: MemberAvatarProps) {
  const className = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shrink-0 transition-colors duration-150${
    onClick ? ' cursor-pointer hover:ring-2 hover:ring-ring/30 active:scale-95' : ''
  }`
  const style = { backgroundColor: member.bg_hex, color: member.color_hex }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className={className}
        style={style}
      >
        {member.initials}
      </button>
    )
  }

  return (
    <div className={className} style={style}>
      {member.initials}
    </div>
  )
}
