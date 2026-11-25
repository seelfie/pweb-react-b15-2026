import { useEffect, useState } from 'react'
import { AlertTriangle, BriefcaseBusiness, Compass, KanbanSquare, Moon, Sun, UserRound } from 'lucide-react'
import './App.css'
import './pipeline.css'
import './bonus.css'
import './global.css'
import { ProfileSkills } from './components/ProfileSkills'
import { JobExplorer } from './components/JobExplorer'
import { ManualApplicationForm } from './components/ManualApplicationForm'
import { BackupControls } from './components/BackupControls'
import { PipelineBoard } from './components/PipelineBoard'
import { useLocalStorage } from './hooks/useLocalStorage'
import { findInterviewConflicts, formatDateTime } from './utils/pipeline'
import type { BackupData } from './utils/backup'
import type { Application, JobListing } from './types'
import type { JobSource } from './types'

function App() {
  const [source, setSource] = useState<JobSource>('live')

  const [skills, setSkills] = useLocalStorage<string[]>('kaptenSkills', [
    'React',
    'TypeScript',
    'CSS',
  ])
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', [])
  const [activeSection, setActiveSection] = useState<'explore' | 'manual' | 'pipeline'>('explore')
  const [notice, setNotice] = useState('')
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const conflicts = findInterviewConflicts(applications)

  function saveJob(job: JobListing) {
    const exists = applications.some(
      (application) =>
        application.company.toLowerCase() === job.company_name.toLowerCase() &&
        application.role.toLowerCase() === job.title.toLowerCase(),
    )
    if (exists) return

    const now = new Date().toISOString()
    const application: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: 'Hybrid',
      status: 'WISHLIST',
      requiredSkills: job.tags ?? [],
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: now, message: 'Lamaran dibuat dari lowongan.' },
      ],
    }
    setApplications((current) => [...current, application])
    setNotice(`Lowongan ${job.title} disimpan ke Wishlist.`)
  }

  function addManualApplication(application: Application) {
    setApplications((current) => [...current, application])
    setNotice(`Lamaran ${application.company} berhasil ditambahkan.`)
  }

  function importBackup(data: BackupData) {
    setApplications(data.applications)
    setSkills(data.kaptenSkills)
    setNotice(`Backup dipulihkan: ${data.applications.length} lamaran, ${data.kaptenSkills.length} skill.`)
  }

  function updateApplication(updated: Application) {
    setApplications((current) =>
      current.map((application) => (application.id === updated.id ? updated : application)),
    )
  }

  function deleteApplication(id: string) {
    setApplications((current) => current.filter((application) => application.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><BriefcaseBusiness size={20} /></span>
          <div>
            <strong>AKU MW MAGANG</strong>
            <small>CAPTAIN'S WORKSPACE</small>
          </div>
        </div>
        <nav>
          <button
            type="button"
            className={activeSection === 'explore' ? 'nav-active' : ''}
            onClick={() => setActiveSection('explore')}
          >
            <Compass size={16} /> Eksplorasi Lowongan
          </button>
          <button
            type="button"
            className={activeSection === 'manual' ? 'nav-active' : ''}
            onClick={() => setActiveSection('manual')}
          >
            <BriefcaseBusiness size={16} /> Tambah Lamaran
          </button>
          <button
            type="button"
            className={activeSection === 'pipeline' ? 'nav-active' : ''}
            onClick={() => setActiveSection('pipeline')}
          >
            <KanbanSquare size={16} /> Pipeline Lamaran ({applications.length})
          </button>
        </nav>
        <div className="topbar-actions">
          <BackupControls
            applications={applications}
            skills={skills}
            onImport={importBackup}
            onNotice={setNotice}
          />
          <button
            type="button"
            className="topbar-btn"
            aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
          </button>
          <div className="avatar"><UserRound size={18} /></div>
        </div>
      </header>

      {conflicts.length > 0 && (
        <div className="conflict-banner global-conflict" role="alert">
          <AlertTriangle size={18} />
          <div>
            {conflicts.map(({ a, b, diffMinutes }) => (
              <p key={`${a.id}-${b.id}`}>
                <strong>Jadwal interview bentrok:</strong> {a.company} ({formatDateTime(a.interviewDateTime ?? '')}) dan{' '}
                {b.company} ({formatDateTime(b.interviewDateTime ?? '')}) berselisih {diffMinutes} menit.
              </p>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>×</button>
        </div>
      )}

      <main className="main-layout">
        {activeSection === 'explore' && (
          <>
            <ProfileSkills
              skills={skills}
              onChange={setSkills}
              source={source}
              onSourceChange={setSource}
            />

            <JobExplorer
              skills={skills}
              applications={applications}
              source={source}
              onSourceChange={setSource}
              onSave={saveJob}
            />
          </>
        )}
        {activeSection === 'pipeline' && (
          <PipelineBoard
            applications={applications}
            skills={skills}
            onUpdate={updateApplication}
            onDelete={deleteApplication}
          />
        )}
        {activeSection === 'manual' && (
          <div className="manual-layout">
            <ProfileSkills
              skills={skills}
              onChange={setSkills}
              source={source}
              onSourceChange={setSource}
            />
            <ManualApplicationForm
              applications={applications}
              onSubmit={addManualApplication}
              onDuplicate={setNotice}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App