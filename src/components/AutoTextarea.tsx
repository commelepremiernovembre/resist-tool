'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

// Zone de texte qui prend d'emblée la hauteur de son contenu et grandit en tapant
// (sur téléphone, on ne peut pas tirer le coin pour l'agrandir).
export function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const ajuster = () => {
    const t = ref.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = t.scrollHeight + 2 + 'px'
  }
  useLayoutEffect(ajuster, [props.value])
  useEffect(() => {
    addEventListener('resize', ajuster)
    return () => removeEventListener('resize', ajuster)
  }, [])
  return <textarea ref={ref} {...props} style={{ ...props.style, overflow: 'hidden', resize: 'none' }} />
}
