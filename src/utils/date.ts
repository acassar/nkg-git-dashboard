const DAY_MS = 1000 * 60 * 60 * 24

/** Nombre de jours entiers écoulés entre `date` et maintenant (>= 0). */
export function daysSince(date: Date | string, now: Date = new Date()): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / DAY_MS))
}

/** Rendu court style « il y a 3 j », « il y a 2 mois ». */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const days = daysSince(date, now)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`
  const years = Math.floor(days / 365)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
