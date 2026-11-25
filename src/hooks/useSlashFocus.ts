import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useSlashFocus(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (document.querySelector('[role="dialog"]')) return

      event.preventDefault()
      ref.current?.focus()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ref])
}