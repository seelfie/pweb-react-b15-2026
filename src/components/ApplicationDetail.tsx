import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Application, ApplicationStatus, WorkMode } from '../types'
import { applicationMatch } from '../utils/skills'
import { formatDateTime, isGhostingRisk, shiftBackDays } from '../utils/pipeline'
import {
  applyTransition,
  getNextStatuses,
  validateTransition,
  type TransitionInput,
} from '../utils/stateMachine'

const STAGES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

interface ApplicationDetailProps {
  application: Application
  skills: string[]
  onUpdate: (application: Application) => void
  onDelete: (id: string) => void
  onClose: () => void
  interviewSlot?: ReactNode
}

function emptyInput(workMode: WorkMode): TransitionInput {
  return {
    cvVersion: '',
    appliedDate: new Date().toISOString().slice(0, 10),
    interviewDateTime: '',
    salaryOffer: '',
    workMode,
  }
}

function formatLogTime(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  return `${day} • ${time}`
}

export function ApplicationDetail({
  application,
  skills,
  onUpdate,
  onDelete,
  onClose,
  interviewSlot,
}: ApplicationDetailProps) {
  const [target, setTarget] = useState<ApplicationStatus | null>(null)
  const [input, setInput] = useState<TransitionInput>(() => emptyInput(application.workMode))
  const [error, setError] = useState('')
  const [newItem, setNewItem] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const nextStatuses = getNextStatuses(application.status)
  const done = application.checklist.filter((item) => item.done).length
  const total = application.checklist.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const currentStage = STAGES.indexOf(application.status)
  const canSimulate = application.status === 'APPLIED' || application.status === 'SCREENING'

  const subtitle = [
    application.workMode,
    `CV: ${application.cvVersion ?? '-'}`,
    application.interviewDateTime ? `Jadwal Interview: ${formatDateTime(application.interviewDateTime)}` : null,
    `Match ${applicationMatch(application, skills)}%`,
  ]
    .filter(Boolean)
    .join(' • ')

  function chooseTarget(status: ApplicationStatus) {
    setTarget(status)
    setInput(emptyInput(application.workMode))
    setError('')
  }

  function updateInput<K extends keyof TransitionInput>(key: K, value: TransitionInput[K]) {
    setInput((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function confirmTransition() {
    if (!target) return
    const message = validateTransition(application.status, target, input)
    if (message) {
      setError(message)
      return
    }
    onUpdate(applyTransition(application, target, input))
    setTarget(null)
    setError('')
  }

  // ---- Checklist: semua update immutable (map / filter / spread) ----
  function addItem() {
    const text = newItem.trim()
    if (!text) return
    onUpdate({
      ...application,
      checklist: [...application.checklist, { id: crypto.randomUUID(), text, done: false }],
    })
    setNewItem('')
  }

  function toggleItem(id: string) {
    onUpdate({
      ...application,
      checklist: application.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    })
  }

  function removeItem(id: string) {
    onUpdate({
      ...application,
      checklist: application.checklist.filter((item) => item.id !== id),
    })
  }

  function addNote() {
    const message = note.trim()
    if (!message) return
    onUpdate({
      ...application,
      activityLogs: [
        ...application.activityLogs,
        { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message },
      ],
    })
    setNote('')
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Detail lamaran ${application.company}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="detail-header">
          <div className="detail-identity">
            <div className="company-logo">{application.company.slice(0, 2).toUpperCase()}</div>
            <div>
              <h2>{application.role} — {application.company}</h2>
              <p className="detail-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="detail-header-actions">
            <span className={`status-pill status-${application.status.toLowerCase()}`}>
              <i className="status-dot" /> {application.status}
            </span>
            {isGhostingRisk(application) && <span className="ghost-badge">Rawan Ghosting</span>}
            {canSimulate && (
              <button type="button" className="secondary-button" onClick={() => onUpdate(shiftBackDays(application, 15))}>
                Simulasi +15 Hari
              </button>
            )}
            <button type="button" className="danger-button" onClick={() => onDelete(application.id)}>
              Hapus
            </button>
            <button type="button" className="icon-button" aria-label="Tutup detail" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="detail-body">
          <div className="detail-column">
            <h3 className="detail-title">TAHAP SELEKSI</h3>
            <ol className="stepper">
              {STAGES.map((stage, index) => (
                <li
                  key={stage}
                  className={currentStage === index ? 'step-current' : currentStage > index ? 'step-done' : ''}
                >
                  {index + 1}. {stage.charAt(0) + stage.slice(1).toLowerCase()}
                </li>
              ))}
            </ol>
            {currentStage === -1 && (
              <p className="muted">Status saat ini: {application.status}.</p>
            )}

            <div className="transition-box">
              <div className="transition-row">
                <span className="transition-label">Pindahkan status ke:</span>
                {nextStatuses.length === 0 ? (
                  <span className="muted-inline">Status {application.status} bersifat final.</span>
                ) : (
                  <div className="transition-options">
                    {nextStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={target === status ? 'opt-active' : 'opt'}
                        onClick={() => chooseTarget(status)}
                      >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {target && (
                <div className="transition-inputs">
                  {target === 'APPLIED' && (
                    <>
                      <input
                        placeholder="Versi CV (mis. CV_Frontend_v2)"
                        value={input.cvVersion}
                        onChange={(event) => updateInput('cvVersion', event.target.value)}
                      />
                      <input
                        type="date"
                        value={input.appliedDate}
                        onChange={(event) => updateInput('appliedDate', event.target.value)}
                      />
                    </>
                  )}
                  {target === 'INTERVIEW' && (
                    <input
                      type="datetime-local"
                      value={input.interviewDateTime}
                      onChange={(event) => updateInput('interviewDateTime', event.target.value)}
                    />
                  )}
                  {target === 'OFFER' && (
                    <>
                      <input
                        type="number"
                        min={1}
                        placeholder="Uang saku / gaji (Rp)"
                        value={input.salaryOffer}
                        onChange={(event) => updateInput('salaryOffer', event.target.value)}
                      />
                      <select
                        value={input.workMode}
                        onChange={(event) => updateInput('workMode', event.target.value as WorkMode)}
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                    </>
                  )}
                  <button type="button" className="confirm-button" onClick={confirmTransition}>
                    Konfirmasi
                  </button>
                </div>
              )}
              {error && <small className="form-error">{error}</small>}
            </div>

            <div className="checklist-head">
              <h3 className="detail-title">DAFTAR PERSIAPAN</h3>
              <span className="progress-text">{done} / {total} selesai</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>

            {total === 0 && <p className="muted">Belum ada tugas persiapan. Tambahkan di bawah.</p>}
            <ul className="checklist">
              {application.checklist.map((item) => (
                <li key={item.id}>
                  <label className={item.done ? 'check-done' : ''}>
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                    <span>{item.text}</span>
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Hapus ${item.text}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-row">
              <input
                value={newItem}
                onChange={(event) => setNewItem(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addItem()}
                placeholder="Tambah tugas persiapan baru..."
              />
              <button type="button" className="confirm-button dark" onClick={addItem}>
                Tambah
              </button>
            </div>
          </div>

          <div className="detail-column detail-side">
            {interviewSlot && <div className="interview-card">{interviewSlot}</div>}

            <h3 className="detail-title">RIWAYAT AKTIVITAS</h3>
            <div className="add-row">
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addNote()}
                placeholder="Tulis catatan..."
              />
              <button type="button" className="confirm-button dark" onClick={addNote}>
                Catat
              </button>
            </div>
            <ul className="activity-log">
              {[...application.activityLogs].reverse().map((log) => (
                <li key={log.id}>
                  <time dateTime={log.timestamp}>{formatLogTime(log.timestamp)}</time>
                  <span>{log.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}