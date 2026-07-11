/** Parse a tournament DATE (YYYY-MM-DD) into a local 10:00 AM start. */
export function getTournamentStartAt(date: string | null | undefined): Date | null {
  if (!date) return null
  const day = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null

  const start = new Date(`${day}T10:00:00`)
  if (Number.isNaN(start.getTime())) return null
  return start
}

export type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getTimeLeft(from: Date, to: Date): TimeLeft | null {
  const difference = to.getTime() - from.getTime()
  if (difference <= 0) return null

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export function formatTournamentStartLabel(start: Date): string {
  return start.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
