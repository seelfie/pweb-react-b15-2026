import type { JobListing } from '../types'

const LIVE_API =
  'https://remotive.com/api/remote-jobs?category=software-dev&limit=30'

export async function fetchJobs(signal?: AbortSignal, source: 'live' | 'fallback' = 'live') {
  if (source === 'fallback') {
    const response = await fetch('/magang-fallback.json', { signal })
    if (!response.ok) throw new Error('Gagal memuat data lowongan lokal')
    return (await response.json()) as JobListing[]
  }

  const response = await fetch(LIVE_API, { signal })
  if (!response.ok) throw new Error(`Gagal mengambil lowongan (${response.status})`)
  const data = (await response.json()) as { jobs?: JobListing[] }
  return data.jobs ?? []
}
