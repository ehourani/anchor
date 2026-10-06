import { useEffect, useRef, useState } from 'react'

export type LegalDoc = 'privacy' | 'terms'

const DOCS: Record<LegalDoc, { title: string; src: string }> = {
  // `.html` so this works on the dev server too; in production (cleanUrls) it
  // redirects to the public /privacy and /terms pages, which stay the single
  // source of truth (they're also the Google OAuth consent-screen URLs).
  privacy: { title: 'Privacy Policy', src: '/privacy.html' },
  terms: { title: 'Terms of Service', src: '/terms.html' },
}

// The privacy policy or terms, read inside the app. The public page is framed
// (it hides its own brand/back links when embedded) and sized to its content,
// so the screen scrolls normally instead of scrolling a box within a box.
export function LegalScreen({ doc }: { doc: LegalDoc }) {
  const { title, src } = DOCS[doc]
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [observer, setObserver] = useState<ResizeObserver | null>(null)

  useEffect(() => () => observer?.disconnect(), [observer])

  const fitToContent = () => {
    const body = frameRef.current?.contentDocument?.body
    if (!body) return
    const measure = () => setHeight(body.scrollHeight)
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      observer?.disconnect()
      const next = new ResizeObserver(measure)
      next.observe(body)
      setObserver(next)
    }
  }

  return (
    <div className="mt-5">
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        onLoad={fitToContent}
        style={{ height: height ?? '70dvh' }}
        className="w-full border-0 bg-transparent"
      />
    </div>
  )
}
