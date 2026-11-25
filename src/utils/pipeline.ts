import type { Application } from '../types'

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

export function isGhostingRisk(app: Application, now: number = Date.now()): boolean {
  if (app.status !== 'APPLIED' && app.status !== 'SCREENING') return false
  return now - new Date(app.lastUpdatedAt).getTime() > 14 * DAY_MS
}

export interface InterviewConflict {
  a: Application
  b: Application
  diffMinutes: number
}

export function findInterviewConflicts(apps: Application[]): InterviewConflict[] {
  const interviews = apps.flatMap((app) =>
    app.status === 'INTERVIEW' && app.interviewDateTime
      ? [{ app, time: new Date(app.interviewDateTime).getTime() }]
      : [],
  )

  const conflicts: InterviewConflict[] = []
  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const diff = Math.abs(interviews[i].time - interviews[j].time)
      if (diff < 60 * MINUTE_MS) {
        conflicts.push({
          a: interviews[i].app,
          b: interviews[j].app,
          diffMinutes: Math.round(diff / MINUTE_MS),
        })
      }
    }
  }
  return conflicts
}

export function shiftBackDays(app: Application, days: number): Application {
  return {
    ...app,
    lastUpdatedAt: new Date(new Date(app.lastUpdatedAt).getTime() - days * DAY_MS).toISOString(),
  }
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export type SortMode = 'newest' | 'interview' | 'offer'

function byNewest(a: Application, b: Application): number {
  return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
}

function isInactive(app: Application): boolean {
  return app.status === 'REJECTED' || app.status === 'GHOSTED'
}

export function sortApplications(
  apps: Application[],
  mode: SortMode,
  now: number = Date.now(),
): Application[] {
  const list = [...apps]

  if (mode === 'interview') {
    const rank = (app: Application): number => {
      if (app.status === 'INTERVIEW' && app.interviewDateTime) {
        const time = new Date(app.interviewDateTime).getTime()
        if (!Number.isNaN(time)) return time >= now ? 0 : 1
      }
      return isInactive(app) ? 3 : 2
    }
    return list.sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      const ta = new Date(a.interviewDateTime ?? '').getTime()
      const tb = new Date(b.interviewDateTime ?? '').getTime()
      if (ra === 0) return ta - tb
      if (ra === 1) return tb - ta
      return byNewest(a, b)
    })
  }

  if (mode === 'offer') {
    const rank = (app: Application): number => {
      if (app.salaryOffer !== undefined) return 0
      return isInactive(app) ? 2 : 1
    }
    return list.sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      if (ra === 0) {
        const diff = (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0)
        if (diff !== 0) return diff
      }
      return byNewest(a, b)
    })
  }

  return list.sort(byNewest)
}