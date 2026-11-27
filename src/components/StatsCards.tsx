import type { Application } from '../types'
import { getStats } from '../utils/stats'

interface StatsCardsProps {
  applications: Application[]
}

export function StatsCards({ applications }: StatsCardsProps) {
  // bukan useState: dihitung ulang tiap render dari props
  const stats = getStats(applications)

  const cards = [
    { label: 'TOTAL LAMARAN', value: String(stats.total), hint: 'semua lamaran di pipeline' },
    { label: 'RESPONSE RATE', value: `${stats.responseRate}%`, hint: `${stats.responded} dari ${stats.total} diproses` },
    { label: 'INTERVIEW RATE', value: `${stats.interviewRate}%`, hint: `${stats.interviewed} masuk wawancara` },
    { label: 'RAWAN GHOSTING', value: String(stats.ghosting), hint: '>14 hari tanpa kabar', danger: stats.ghosting > 0 },
    { label: 'TOTAL OFFER', value: String(stats.offers), hint: 'siap dibandingkan' },
  ]

  return (
    <section className="stats-row" aria-label="Statistik lamaran">
      {cards.map((card) => (
        <div className="stat-card" key={card.label}>
          <small>{card.label}</small>
          <strong className={card.danger ? 'stat-danger' : ''}>{card.value}</strong>
          <span>{card.hint}</span>
        </div>
      ))}
    </section>
  )
}