import type { Application, JobListing } from '../types'

export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase()
}

export function getSkillMatch(job: JobListing, captainSkills: string[]) {
  const required = job.tags.filter((skill) => skill.trim().length > 0)
  const normalizedSkills = new Set(captainSkills.map(normalizeSkill))
  const matching = required.filter((skill) => normalizedSkills.has(normalizeSkill(skill)))
  const missing = required.filter((skill) => !normalizedSkills.has(normalizeSkill(skill)))
  const score = required.length
    ? Math.round((matching.length / required.length) * 100)
    : 0

  return { score, matching, missing }
}

export function applicationMatch(application: Application, captainSkills: string[]) {
  return getSkillMatch(
    {
      id: application.id,
      title: application.role,
      company_name: application.company,
      category: '',
      candidate_required_location: '',
      salary: '',
      tags: application.requiredSkills,
    },
    captainSkills,
  ).score
}

export function isDuplicateApplication(
  applications: Application[],
  company: string,
  role: string,
) {
  const normalizedCompany = company.trim().toLowerCase()
  const normalizedRole = role.trim().toLowerCase()

  return applications.some(
    (application) =>
      application.company.trim().toLowerCase() === normalizedCompany &&
      application.role.trim().toLowerCase() === normalizedRole,
  )
}
