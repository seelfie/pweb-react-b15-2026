import type { Application, ApplicationStatus, WorkMode } from '../types'

export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
}

export function getNextStatuses(status: ApplicationStatus): ApplicationStatus[] {
  return TRANSITIONS[status]
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export interface TransitionInput {
  cvVersion: string
  appliedDate: string
  interviewDateTime: string
  salaryOffer: string
  workMode: WorkMode
}

/** Mengembalikan pesan error, atau null kalau valid. */
export function validateTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  input: TransitionInput,
): string | null {
  if (!canTransition(from, to)) return `Status ${from} tidak bisa langsung pindah ke ${to}.`

  if (to === 'APPLIED') {
    if (!input.cvVersion.trim()) return 'Versi CV wajib diisi.'
    if (!input.appliedDate) return 'Tanggal melamar wajib diisi.'
  }
  if (to === 'INTERVIEW' && !input.interviewDateTime) {
    return 'Jadwal interview wajib diisi.'
  }
  if (to === 'OFFER') {
    const salary = Number(input.salaryOffer)
    if (!Number.isFinite(salary) || salary <= 0) return 'Gaji offer harus lebih dari 0.'
    if (!input.workMode) return 'Mode kerja wajib dipilih.'
  }
  return null
}

export function applyTransition(
  app: Application,
  to: ApplicationStatus,
  input: TransitionInput,
): Application {
  const now = new Date().toISOString()
  const base: Application = {
    ...app,
    status: to,
    lastUpdatedAt: now,
    activityLogs: [
      ...app.activityLogs,
      { id: crypto.randomUUID(), timestamp: now, message: describeTransition(app.status, to, input) },
    ],
  }

  if (to === 'APPLIED') {
    return { ...base, cvVersion: input.cvVersion.trim(), appliedDate: input.appliedDate }
  }
  if (to === 'INTERVIEW') {
    return { ...base, interviewDateTime: input.interviewDateTime }
  }
  if (to === 'OFFER') {
    return { ...base, salaryOffer: Number(input.salaryOffer), workMode: input.workMode }
  }
  return base
}

function describeTransition(from: ApplicationStatus, to: ApplicationStatus, input: TransitionInput): string {
  if (to === 'APPLIED') return `Pindah ${from} → APPLIED (CV: ${input.cvVersion.trim()}).`
  if (to === 'INTERVIEW') return `Pindah ${from} → INTERVIEW (jadwal ${input.interviewDateTime.replace('T', ' ')}).`
  if (to === 'OFFER') return `Pindah ${from} → OFFER (Rp ${Number(input.salaryOffer).toLocaleString('id-ID')}, ${input.workMode}).`
  return `Pindah ${from} → ${to}.`
}