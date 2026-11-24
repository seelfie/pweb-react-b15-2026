import { useEffect, useMemo, useState } from 'react'
import { Bookmark, RotateCcw, Search } from 'lucide-react'
import type { Application, JobListing } from '../types'
import { fetchJobs } from '../services/jobService'
import { getSkillMatch } from '../utils/skills'
import { useDebounce } from '../hooks/useDebounce'

interface JobExplorerProps {
  skills: string[]
  applications: Application[]
  onSave: (job: JobListing) => void
}

export function JobExplorer({ skills, applications, onSave }: JobExplorerProps) {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('Semua')
  const [sortByMatch, setSortByMatch] = useState(true)
  const debouncedKeyword = useDebounce(keyword, 400)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJobs(controller.signal, 'live')
        setJobs(data)
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError('Gagal memuat lowongan dari API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  async function retry(source: 'live' | 'fallback') {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    try {
      setJobs(await fetchJobs(controller.signal, source))
    } catch {
      setError('Gagal memuat lowongan. Silakan gunakan fallback lokal.')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(jobs.map((job) => job.category).filter(Boolean)))],
    [jobs],
  )

  const visibleJobs = useMemo(() => {
    const text = debouncedKeyword.toLowerCase()
    const filtered = jobs.filter((job) => {
      const matchesText =
        !text ||
        job.title.toLowerCase().includes(text) ||
        job.company_name.toLowerCase().includes(text)
      const matchesCategory = category === 'Semua' || job.category === category
      return matchesText && matchesCategory
    })

    if (!sortByMatch) return filtered
    return [...filtered].sort(
      (a, b) =>
        getSkillMatch(b, skills).score - getSkillMatch(a, skills).score,
    )
  }, [jobs, debouncedKeyword, category, sortByMatch, skills])

  return (
    <section className="explorer">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TEMUKAN PELUANG</p>
          <h1>Eksplorasi Lowongan</h1>
        </div>
        <button type="button" className="secondary-button" onClick={() => void retry('fallback')}>
          Sumber Lokal
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari posisi atau perusahaan..."
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button
          type="button"
          className={sortByMatch ? 'filter-active' : 'secondary-button'}
          onClick={() => setSortByMatch((current) => !current)}
        >
          Match Tertinggi
        </button>
      </div>

      {loading && <div className="state-card">Memuat lowongan...</div>}
      {error && (
        <div className="state-card error-state">
          <p>{error}</p>
          <button type="button" onClick={() => void retry('live')}>
            <RotateCcw size={16} /> Coba Lagi
          </button>
          <button type="button" onClick={() => void retry('fallback')}>
            Fallback Lokal
          </button>
        </div>
      )}
      {!loading && !error && visibleJobs.length === 0 && (
        <div className="state-card">Tidak ada lowongan yang cocok.</div>
      )}

      <div className="job-grid">
        {visibleJobs.map((job) => {
          const match = getSkillMatch(job, skills)
          const alreadySaved = applications.some(
            (application) =>
              application.company.toLowerCase() === job.company_name.toLowerCase() &&
              application.role.toLowerCase() === job.title.toLowerCase(),
          )
          const scoreClass = match.score >= 70 ? 'score-high' : match.score >= 40 ? 'score-medium' : 'score-low'

          return (
            <article className="job-card" key={job.id}>
              <div className="job-card-header">
                <div className="company-logo">{job.company_name.slice(0, 2).toUpperCase()}</div>
                <span className={`score ${scoreClass}`}>{match.score}% Match</span>
              </div>
              <h3>{job.title}</h3>
              <p className="company-name">{job.company_name}</p>
              <p className="location">{job.candidate_required_location || 'Lokasi tidak tersedia'}</p>
              <p className="salary">{job.salary || 'Gaji tidak dicantumkan'}</p>
              <div className="tag-section">
                <span>Skill cocok</span>
                <div className="mini-tags">
                  {match.matching.map((skill) => <b className="tag match" key={skill}>{skill}</b>)}
                </div>
              </div>
              {match.missing.length > 0 && (
                <div className="tag-section">
                  <span>Masih kurang</span>
                  <div className="mini-tags">
                    {match.missing.map((skill) => <b className="tag missing" key={skill}>{skill}</b>)}
                  </div>
                </div>
              )}
              <button
                type="button"
                className="save-button"
                disabled={alreadySaved}
                onClick={() => onSave(job)}
              >
                <Bookmark size={16} fill={alreadySaved ? 'currentColor' : 'none'} />
                {alreadySaved ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
