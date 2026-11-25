import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { JobSource } from '../types'

interface ProfileSkillsProps {
  skills: string[]
  onChange: (skills: string[]) => void
  source: JobSource
  onSourceChange: (source: JobSource) => void
}

const SOURCE_OPTIONS: { value: JobSource; label: string }[] = [
  { value: 'live', label: 'Remotive API (Live)' },
  { value: 'fallback', label: 'Dataset Magang ID (Lokal)' },
]

export function ProfileSkills({ skills, onChange, source, onSourceChange }: ProfileSkillsProps) {
  const [skillInput, setSkillInput] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addSkill() {
    const normalized = skillInput.trim()
    if (!normalized) {
      setError('Masukkan nama skill.')
      inputRef.current?.focus()
      return
    }

    if (skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      setError('Skill sudah ada dalam profil.')
      inputRef.current?.focus()
      return
    }

    onChange([...skills, normalized])
    setSkillInput('')
    setError('')
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((item) => item !== skill))
  }

  return (
    <aside className="profile-card">
      <h2>Profil Skill Kapten</h2>
      <p className="muted">Digunakan untuk menghitung persentase kecocokan tiap lowongan.</p>

      <div className="inline-form">
        <input
          ref={inputRef}
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addSkill()}
          placeholder="Tambah skill..."
          aria-invalid={error !== ''}
        />
        <button type="button" className="primary-icon" onClick={addSkill}>
          Tambah
        </button>
      </div>
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}

      <div className="skill-tags">
        {skills.map((skill) => (
          <span className="skill-chip" key={skill}>
            {skill}
            <button type="button" aria-label={`Hapus skill ${skill}`} onClick={() => removeSkill(skill)}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="source-selector" role="radiogroup" aria-labelledby="source-title">
        <p id="source-title" className="source-title">
          Sumber Data Lowongan
        </p>
        {SOURCE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`source-option${source === option.value ? ' is-active' : ''}`}
          >
            <input
              type="radio"
              name="job-source"
              value={option.value}
              checked={source === option.value}
              onChange={() => onSourceChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </aside>
  )
}