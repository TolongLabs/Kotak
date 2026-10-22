import { useState } from 'react'
import { PageTransition } from '../../components/kotak/PageTransition'
import { Button } from '../../components/ui/Button'
import { ViewLoading } from '../../components/ui/Skeleton'

export function ShellGallery() {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="space-y-8">
      <h2 className="text-title-l">Shell States Gallery</h2>
      <div className="space-y-4">
        <h3 className="text-title-s">Page Transition</h3>
        <Button variant="secondary" onClick={() => setPlaying(true)}>
          Play Page Transition
        </Button>
        {playing && <PageTransition onDone={() => setPlaying(false)} />}
      </div>
      <div className="space-y-4">
        <h3 className="text-title-s">View Loading</h3>
        <ViewLoading />
      </div>
    </section>
  )
}
