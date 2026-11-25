import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import type { Application } from '../types'
import { createBackup, downloadBackup, parseBackup, type BackupData } from '../utils/backup'

interface BackupControlsProps {
  applications: Application[]
  skills: string[]
  onImport: (data: BackupData) => void
  onNotice: (message: string) => void
}

export function BackupControls({ applications, skills, onImport, onNotice }: BackupControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    downloadBackup(createBackup(applications, skills))
    onNotice(`Backup ${applications.length} lamaran berhasil diunduh.`)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' 
    if (!file) return

    try {
      const data = parseBackup(await file.text())
      const ok = window.confirm(
        `Ganti data saat ini dengan backup berisi ${data.applications.length} lamaran dan ${data.kaptenSkills.length} skill?`,
      )
      if (!ok) return
      onImport(data)
    } catch (reason) {
      onNotice(reason instanceof Error ? reason.message : 'Gagal membaca file backup.')
    }
  }

  return (
    <>
      <button type="button" className="topbar-btn" onClick={handleExport} title="Export backup JSON">
        <Download size={15} /> <span>Export</span>
      </button>
      <button
        type="button"
        className="topbar-btn"
        onClick={() => fileRef.current?.click()}
        title="Import backup JSON"
      >
        <Upload size={15} /> <span>Import</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => void handleFile(event)}
      />
    </>
  )
}