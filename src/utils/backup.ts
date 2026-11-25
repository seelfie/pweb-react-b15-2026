import type { ActivityLog, Application, ApplicationStatus, ChecklistItem, WorkMode } from '../types'

const STATUSES: ApplicationStatus[] = [
  'WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED',
]
const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'Onsite']

export interface BackupData {
  version: 1
  exportedAt: string
  applications: Application[]
  kaptenSkills: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.done === 'boolean'
  )
}

function isActivityLog(value: unknown): value is ActivityLog {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.message === 'string'
  )
}

function isApplication(value: unknown): value is Application {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.company === 'string' &&
    typeof value.role === 'string' &&
    typeof value.workMode === 'string' &&
    WORK_MODES.includes(value.workMode as WorkMode) &&
    typeof value.status === 'string' &&
    STATUSES.includes(value.status as ApplicationStatus) &&
    isStringArray(value.requiredSkills) &&
    isOptionalString(value.cvVersion) &&
    isOptionalString(value.appliedDate) &&
    isOptionalString(value.interviewDateTime) &&
    (value.salaryOffer === undefined || typeof value.salaryOffer === 'number') &&
    typeof value.lastUpdatedAt === 'string' &&
    Array.isArray(value.checklist) &&
    value.checklist.every(isChecklistItem) &&
    Array.isArray(value.activityLogs) &&
    value.activityLogs.every(isActivityLog)
  )
}

export function createBackup(applications: Application[], kaptenSkills: string[]): BackupData {
  return { version: 1, exportedAt: new Date().toISOString(), applications, kaptenSkills }
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `aku-mw-magang-backup-${data.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function parseBackup(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('File bukan JSON yang valid.')
  }

  if (!isRecord(raw)) throw new Error('Format backup tidak dikenali.')
  if (!Array.isArray(raw.applications) || !raw.applications.every(isApplication)) {
    throw new Error('Data lamaran di file tidak valid.')
  }
  if (!isStringArray(raw.kaptenSkills)) throw new Error('Data skill di file tidak valid.')

  return {
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    applications: raw.applications,
    kaptenSkills: raw.kaptenSkills,
  }
}