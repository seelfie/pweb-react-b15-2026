import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

interface ProfileSkillsProps {
  skills: string[]
  onChange: (skills: string[]) => void
}

export function ProfileSkills({ skills, onChange }: ProfileSkillsProps) {
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
      <h2>Profil Skill</h2>
      <p className="muted">Skill yang dimiliki oleh Kapten</p>
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
      <div className="inline-form">
        <input
          ref={inputRef}
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addSkill()}
          placeholder="Tambah skill..."
        />
        <button type="button" className="primary-icon" aria-label="Tambah skill" onClick={addSkill}>
          <Plus size={18} />
        </button>
      </div>
      {error && <small className="form-error">{error}</small>}
    </aside>
  )
}
