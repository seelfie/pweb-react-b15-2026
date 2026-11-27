import { useEffect, useState } from 'react'

const QUESTIONS: string[] = [
  'Ceritakan tentang dirimu dan kenapa kamu tertarik magang di posisi ini.',
  'Ceritakan bug tersulit yang pernah kamu atasi di proyekmu, dan bagaimana caramu memperbaikinya.',
  'Apa perbedaan props dan state di React?',
  'Bagaimana kamu mengelola waktu saat mengerjakan beberapa tugas sekaligus?',
  'Apa yang ingin kamu pelajari selama magang di sini?',
]

const START_SECONDS = 120

function formatTime(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function InterviewTimer() {
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS)
  const [running, setRunning] = useState(false)

  //timer hanya "jalan" kalau tombol start aktif DAN waktu belum habis
  const isRunning = running && secondsLeft > 0

  useEffect(() => {
    if (!isRunning) return

    const id = setInterval(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)

    //dipanggil saat pause, saat waktu habis, dan saat panel ditutup (unmount)
    return () => clearInterval(id)
  }, [isRunning])

  function reset() {
    setRunning(false)
    setSecondsLeft(START_SECONDS)
  }

  function nextQuestion() {
    setIndex((current) => (current + 1) % QUESTIONS.length)
    reset()
  }

  return (
    <>
      <div className="timer-head">
        <h3 className="detail-title">LATIHAN INTERVIEW</h3>
        <span className="progress-text">Soal {index + 1} / {QUESTIONS.length}</span>
      </div>
      <p className="timer-question">"{QUESTIONS[index]}"</p>
      <div className="timer-row">
        <span className={`timer-display ${secondsLeft === 0 ? 'timer-over' : ''}`}>
          {formatTime(secondsLeft)}
        </span>
        <div className="timer-actions">
          <button
            type="button"
            className="confirm-button"
            disabled={secondsLeft === 0}
            onClick={() => setRunning((current) => !current)}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="secondary-button" onClick={reset}>Reset</button>
          <button type="button" className="secondary-button" onClick={nextQuestion}>Soal Berikutnya</button>
        </div>
      </div>
    </>
  )
}