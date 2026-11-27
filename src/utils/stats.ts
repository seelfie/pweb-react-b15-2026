import type { Application, WorkMode } from '../types'
import { applicationMatch } from './skills'
import { isGhostingRisk } from './pipeline'

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}

// semua dihitung langsung dari array applications (derived state)
export function getStats(applications: Application[]) {
  const total = applications.length
  const responded = applications.filter((app) =>
    ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(app.status),
  ).length
  const interviewed = applications.filter(
    (app) => app.status === 'INTERVIEW' || app.status === 'OFFER',
  ).length
  const ghosting = applications.filter((app) => isGhostingRisk(app)).length
  const offers = applications.filter((app) => app.status === 'OFFER').length

  return {
    total,
    responded,
    responseRate: percent(responded, total),
    interviewed,
    interviewRate: percent(interviewed, total),
    ghosting,
    offers,
  }
}

const MODE_SCORE: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 }

export interface OfferScore {
  app: Application
  skillMatch: number
  salaryPoints: number // maks 50
  modePoints: number // maks 25
  skillPoints: number // maks 25
  total: number // maks 100
}

export function scoreOffer(app: Application, maxSalary: number, skills: string[]): OfferScore {
  const salaryScore = maxSalary > 0 ? ((app.salaryOffer ?? 0) / maxSalary) * 100 : 0
  const skillMatch = applicationMatch(app, skills)

  const salaryPoints = salaryScore * 0.5
  const modePoints = MODE_SCORE[app.workMode] * 0.25
  const skillPoints = skillMatch * 0.25

  return {
    app,
    skillMatch,
    salaryPoints,
    modePoints,
    skillPoints,
    total: salaryPoints + modePoints + skillPoints,
  }
}