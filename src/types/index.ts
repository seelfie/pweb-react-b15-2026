export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED'

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface ActivityLog {
  id: string
  timestamp: string
  message: string
}

export interface Application {
  id: string
  company: string
  role: string
  workMode: WorkMode
  status: ApplicationStatus
  requiredSkills: string[]
  cvVersion?: string
  appliedDate?: string
  interviewDateTime?: string
  salaryOffer?: number
  lastUpdatedAt: string
  checklist: ChecklistItem[]
  activityLogs: ActivityLog[]
}

export interface JobListing {
  id: number | string
  title: string
  company_name: string
  category: string
  candidate_required_location: string
  salary: string
  tags: string[]
}
