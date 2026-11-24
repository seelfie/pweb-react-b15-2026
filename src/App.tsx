import { useState } from 'react'
import { BriefcaseBusiness, Compass, UserRound } from 'lucide-react'
import './App.css'
import { ProfileSkills } from './components/ProfileSkills'
import { JobExplorer } from './components/JobExplorer'
import { ManualApplicationForm } from './components/ManualApplicationForm'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Application, JobListing } from './types'

function App() {
  const [skills, setSkills] = useLocalStorage<string[]>('kaptenSkills', [
    'React',
    'TypeScript',
    'CSS',
  ])
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', [])
  const [activeSection, setActiveSection] = useState<'explore' | 'manual'>('explore')
  const [notice, setNotice] = useState('')

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
        </nav>
        <div className="avatar"><UserRound size={18} /></div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>×</button>
        </div>
      )}

      <main className="main-layout">
        {activeSection === 'explore' ? (
          <>
            <ProfileSkills skills={skills} onChange={setSkills} />
            <JobExplorer skills={skills} applications={applications} onSave={saveJob} />
          </>
        ) : (
          <div className="manual-layout">
            <ProfileSkills skills={skills} onChange={setSkills} />
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
