import type { Member } from '@/lib/supabase/types'

interface MemberAvatarProps {
  member: Member
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-[26px] w-[26px] text-[10px]',
  md: 'h-[36px] w-[36px] text-xs',
  lg: 'h-[44px] w-[44px] text-sm',
}

export function MemberAvatar({ member, size = 'md' }: MemberAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shrink-0 transition-colors duration-150`}
      style={{ backgroundColor: member.bg_hex, color: member.color_hex }}
    >
      {member.initials}
    </div>
  )
}
