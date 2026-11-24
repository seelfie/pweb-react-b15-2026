import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Application, ApplicationStatus, WorkMode } from '../types'

interface ManualApplicationFormProps {
  applications: Application[]
  onSubmit: (application: Application) => void
  onDuplicate: (message: string) => void
}

interface FormState {
  company: string
  role: string
  workMode: WorkMode
  status: ApplicationStatus
  requiredSkills: string
  cvVersion: string
  appliedDate: string
}

export function ManualApplicationForm({
  applications,
  onSubmit,
  onDuplicate,
}: ManualApplicationFormProps) {
  const [form, setForm] = useState<FormState>({
    company: '',
    role: '',
    workMode: 'Hybrid',
    status: 'WISHLIST',
    requiredSkills: '',
    cvVersion: '',
    appliedDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const companyRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLInputElement>(null)
  const requiredSkillsRef = useRef<HTMLInputElement>(null)
  const cvRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.company.trim()) nextErrors.company = 'Perusahaan wajib diisi.'
    if (!form.role.trim()) nextErrors.role = 'Posisi wajib diisi.'
    if (!form.requiredSkills.trim()) nextErrors.requiredSkills = 'Required skill wajib diisi.'
    if (form.status === 'APPLIED' && !form.cvVersion.trim()) nextErrors.cvVersion = 'Versi CV wajib diisi.'
    if (form.status === 'APPLIED' && !form.appliedDate) nextErrors.appliedDate = 'Tanggal melamar wajib diisi.'

    const duplicate = applications.some(
      (application) =>
        application.company.trim().toLowerCase() === form.company.trim().toLowerCase() &&
        application.role.trim().toLowerCase() === form.role.trim().toLowerCase(),
    )
    if (duplicate) {
      nextErrors.role = 'Lamaran untuk perusahaan dan posisi ini sudah ada.'
      onDuplicate('Lamaran duplikat ditolak.')
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.company) companyRef.current?.focus()
      else if (nextErrors.role) roleRef.current?.focus()
      else if (nextErrors.requiredSkills) requiredSkillsRef.current?.focus()
      else if (nextErrors.cvVersion) cvRef.current?.focus()
      else if (nextErrors.appliedDate) dateRef.current?.focus()
      return
    }

    const now = new Date().toISOString()
    onSubmit({
      id: crypto.randomUUID(),
      company: form.company.trim(),
      role: form.role.trim(),
      workMode: form.workMode,
      status: form.status,
      requiredSkills: form.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      cvVersion: form.status === 'APPLIED' ? form.cvVersion.trim() : undefined,
      appliedDate: form.status === 'APPLIED' ? form.appliedDate : undefined,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: now, message: `Lamaran dibuat dengan status ${form.status}.` },
      ],
    })

    setForm({
      company: '',
      role: '',
      workMode: 'Hybrid',
      status: 'WISHLIST',
      requiredSkills: '',
      cvVersion: '',
      appliedDate: '',
    })
  }

  return (
    <section className="manual-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CATAT SENDIRI</p>
          <h2>Tambah Lamaran Manual</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Perusahaan
          <input
            ref={companyRef}
            value={form.company}
            onChange={(event) => updateField('company', event.target.value)}
            placeholder="Contoh: PT Teknologi Nusantara"
          />
          {errors.company && <small className="form-error">{errors.company}</small>}
        </label>
        <label>
          Posisi / Role
          <input
            ref={roleRef}
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
            placeholder="Contoh: Frontend Intern"
          />
          {errors.role && <small className="form-error">{errors.role}</small>}
        </label>
        <div className="form-row">
          <label>
            Mode Kerja
            <select
              value={form.workMode}
              onChange={(event) => updateField('workMode', event.target.value as WorkMode)}
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </label>
          <label>
            Status Awal
            <select
              value={form.status}
              onChange={(event) => updateField('status', event.target.value as ApplicationStatus)}
            >
              <option value="WISHLIST">WISHLIST</option>
              <option value="APPLIED">APPLIED</option>
            </select>
          </label>
        </div>
        {form.status === 'APPLIED' && (
          <div className="form-row">
            <label>
              Versi CV
              <input
                ref={cvRef}
                value={form.cvVersion}
                onChange={(event) => updateField('cvVersion', event.target.value)}
                placeholder="CV_Frontend_v2"
              />
              {errors.cvVersion && <small className="form-error">{errors.cvVersion}</small>}
            </label>
            <label>
              Tanggal Melamar
              <input
                ref={dateRef}
                type="date"
                value={form.appliedDate}
                onChange={(event) => updateField('appliedDate', event.target.value)}
              />
              {errors.appliedDate && <small className="form-error">{errors.appliedDate}</small>}
            </label>
          </div>
        )}
        <label>
          Required Skills
          <input
            id="required-skills"
            ref={requiredSkillsRef}
            value={form.requiredSkills}
            onChange={(event) => updateField('requiredSkills', event.target.value)}
            placeholder="React, TypeScript, CSS"
          />
          {errors.requiredSkills && <small className="form-error">{errors.requiredSkills}</small>}
        </label>
        <button type="submit" className="submit-button">Tambah Lamaran</button>
      </form>
    </section>
  )
}
