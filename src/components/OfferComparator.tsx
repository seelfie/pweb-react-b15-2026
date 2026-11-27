import { useState } from 'react'
import type { Application } from '../types'
import { scoreOffer, type OfferScore } from '../utils/stats'

interface OfferComparatorProps {
  applications: Application[]
  skills: string[]
}

function OfferCard({ result, best }: { result: OfferScore; best: boolean }) {
  const { app } = result
  return (
    <article className={`job-card offer-card ${best ? 'offer-best' : ''}`}>
      <div className="job-card-header">
        <h3>{app.company}</h3>
        {best && <span className="best-badge">Rekomendasi Terbaik</span>}
      </div>
      <p className="location">{app.role}</p>

      <dl className="score-list">
        <div>
          <dt>Uang Saku / Bulan</dt>
          <dd>Rp {(app.salaryOffer ?? 0).toLocaleString('id-ID')} → {result.salaryPoints.toFixed(1)} / 50</dd>
        </div>
        <div>
          <dt>Mode Kerja</dt>
          <dd>{app.workMode} → {result.modePoints.toFixed(1)} / 25</dd>
        </div>
        <div>
          <dt>Kecocokan Skill</dt>
          <dd>{result.skillMatch}% → {result.skillPoints.toFixed(1)} / 25</dd>
        </div>
      </dl>

      <div className="total-score">
        <span>TOTAL SKOR BERBOBOT</span>
        <strong>{result.total.toFixed(1)}</strong>
      </div>
    </article>
  )
}

export function OfferComparator({ applications, skills }: OfferComparatorProps) {
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const offers = applications.filter((app) => app.status === 'OFFER')

  // kalo belum memilih, pakai offer pertama dan kedua sebagai default
  const offerA = offers.find((app) => app.id === idA) ?? offers[0]
  const offerB = offers.find((app) => app.id === idB) ?? offers[1]

  const body = () => {
    if (offers.length < 2) {
      return (
        <div className="state-card">
          Belum cukup offer. Butuh minimal 2 lamaran berstatus OFFER untuk dibandingkan
          (saat ini: {offers.length}).
        </div>
      )
    }
    if (offerA.id === offerB.id) {
      return <div className="state-card">Pilih dua offer yang berbeda.</div>
    }

    const maxSalary = Math.max(offerA.salaryOffer ?? 0, offerB.salaryOffer ?? 0)
    const resultA = scoreOffer(offerA, maxSalary, skills)
    const resultB = scoreOffer(offerB, maxSalary, skills)

    return (
      <div className="compare-grid">
        <OfferCard result={resultA} best={resultA.total >= resultB.total} />
        <OfferCard result={resultB} best={resultB.total > resultA.total} />
      </div>
    )
  }

  return (
    <section className="explorer comparator">
      <div className="section-heading">
        <div>
          <p className="eyebrow">OFFER COMPARATOR</p>
          <h1>Bandingkan Offer Magang</h1>
          <p className="muted">Bobot: Uang Saku 50% • Mode Kerja 25% • Kecocokan Skill 25%</p>
        </div>
      </div>

      {offers.length >= 2 && (
        <div className="compare-select">
          <label>
            Offer A
            <select value={offerA.id} onChange={(event) => setIdA(event.target.value)}>
              {offers.map((app) => (
                <option key={app.id} value={app.id}>{app.company} — {app.role}</option>
              ))}
            </select>
          </label>
          <label>
            Offer B
            <select value={offerB.id} onChange={(event) => setIdB(event.target.value)}>
              {offers.map((app) => (
                <option key={app.id} value={app.id}>{app.company} — {app.role}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {body()}
    </section>
  )
}