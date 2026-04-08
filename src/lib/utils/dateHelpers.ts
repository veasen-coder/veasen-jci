import { format, formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const KL_TIMEZONE = 'Asia/Kuala_Lumpur'

export function formatDateKL(date: string | Date, formatStr: string = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(d, KL_TIMEZONE)
  return format(zonedDate, formatStr)
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getTodayKL() {
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  return format(now, 'yyyy-MM-dd')
}

export function getTodayDisplayKL() {
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  return format(now, 'EEEE, dd MMMM yyyy')
}

export function getStartOfWeekKL() {
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - diff)
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

export function getTodayMidnightKL() {
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  now.setHours(0, 0, 0, 0)
  return now
}

export function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  const today = getTodayKL()
  return dueDate < today
}

export function isDueThisWeek(dueDate: string | null) {
  if (!dueDate) return false
  const today = getTodayKL()
  if (dueDate < today) return false
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)
  const in7DaysStr = format(in7Days, 'yyyy-MM-dd')
  return dueDate <= in7DaysStr
}

export function isDueSoon(dueDate: string | null) {
  if (!dueDate) return false
  const today = getTodayKL()
  if (dueDate < today) return false
  const now = toZonedTime(new Date(), KL_TIMEZONE)
  const in3Days = new Date(now)
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysStr = format(in3Days, 'yyyy-MM-dd')
  return dueDate <= in3DaysStr
}

export function formatDueDate(dueDate: string | null) {
  if (!dueDate) return 'No due date'
  return formatDateKL(dueDate + 'T00:00:00', 'dd MMM')
}
