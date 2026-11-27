import { useMemo, useRef, useState } from 'react'
import { Clock, FastForward, Search } from 'lucide-react'
import type { Application, ApplicationStatus } from '../types'
import { applicationMatch } from '../utils/skills'
import { formatDateTime, isGhostingRisk, shiftBackDays, sortApplications, type SortMode } from '../utils/pipeline'
import { useSlashFocus } from '../hooks/useSlashFocus'
import { ApplicationDetail } from './ApplicationDetail'
import { InterviewTimer } from './InterviewTimer'

const STATUSES: ApplicationStatus[] = [
  'WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED',
]

interface PipelineBoardProps {
  applications: Application[]
  skills: string[]
  onUpdate: (application: Application) => void
  onDelete: (id: string) => void
}

export function PipelineBoard({ applications, skills, onUpdate, onDelete }: PipelineBoardProps) {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [onlyGhosting, setOnlyGhosting] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useSlashFocus(searchRef)

  const visible = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    const filtered = applications.filter((app) => {
      if (text && !`${app.company} ${app.role}`.toLowerCase().includes(text)) return false
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false
      if (onlyGhosting && !isGhostingRisk(app)) return false
      return true
    })

    return sortApplications(filtered, sortMode)
  }, [applications, keyword, statusFilter, onlyGhosting, sortMode])

  const selected = applications.find((app) => app.id === selectedId) ?? null

  return (
    <section className="pipeline-page">
      <div className="explorer">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WAR ROOM</p>
            <h1>Pipeline Lamaran ({applications.length})</h1>
          </div>
        </div>

        <div className="pipeline-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              ref={searchRef}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari perusahaan atau posisi... (tekan /)"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | 'ALL')}
            aria-label="Filter status"
          >
            <option value="ALL">Semua Status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Urutkan"
          >
            <option value="newest">Terbaru</option>
            <option value="interview">Jadwal Interview Terdekat</option>
            <option value="offer">Offer Tertinggi</option>
          </select>
          <button
            type="button"
            className={onlyGhosting ? 'filter-active' : 'secondary-button'}
            aria-pressed={onlyGhosting}
            onClick={() => setOnlyGhosting((current) => !current)}
          >
            Hanya Rawan Ghosting
          </button>
        </div>

        {applications.length === 0 && (
          <div className="state-card">
            Belum ada lamaran. Simpan lowongan dari Eksplorasi atau tambah lamaran manual.
          </div>
        )}
        {applications.length > 0 && visible.length === 0 && (
          <div className="state-card">Tidak ada lamaran yang cocok dengan filter.</div>
        )}

        <div className="job-grid">
          {visible.map((app) => {
            const match = applicationMatch(app, skills)
            const scoreClass = match >= 70 ? 'score-high' : match >= 40 ? 'score-medium' : 'score-low'
            const done = app.checklist.filter((item) => item.done).length
            const canSimulate = app.status === 'APPLIED' || app.status === 'SCREENING'

            return (
              <article className="job-card" key={app.id}>
                <div className="job-card-header">
                  <span className={`status-pill status-${app.status.toLowerCase()}`}>{app.status}</span>
                  <span className={`score ${scoreClass}`}>{match}% Match</span>
                </div>
                <h3>{app.role}</h3>
                <p className="company-name">{app.company}</p>
                <p className="location">
                  {app.workMode} • CV: {app.cvVersion ?? '-'}
                </p>
                {app.interviewDateTime && app.status === 'INTERVIEW' && (
                  <p className="location">
                    <Clock size={11} /> Interview: {formatDateTime(app.interviewDateTime)}
                  </p>
                )}
                {app.salaryOffer !== undefined && (
                  <p className="salary">Rp {app.salaryOffer.toLocaleString('id-ID')}</p>
                )}
                <p className="location">
                  Checklist {done}/{app.checklist.length}
                </p>
                {isGhostingRisk(app) && <span className="ghost-badge">Rawan Ghosting</span>}

                <div className="card-actions">
                  <button type="button" className="save-button" onClick={() => setSelectedId(app.id)}>
                    Buka Detail
                  </button>
                  {canSimulate && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => onUpdate(shiftBackDays(app, 15))}
                    >
                      <FastForward size={13} /> Simulasi +15 Hari
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {selected && (
        <ApplicationDetail
          key={selected.id}
          application={selected}
          skills={skills}
          onUpdate={onUpdate}
          onDelete={(id) => {
            setSelectedId(null)
            onDelete(id)
          }}
          onClose={() => setSelectedId(null)}
          interviewSlot={<InterviewTimer />}
        />
      )}
    </section>
  )
}