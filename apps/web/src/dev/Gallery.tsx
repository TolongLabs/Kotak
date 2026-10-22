import { ActionsGallery } from './gallery/ActionsGallery'
import { FormsGallery } from './gallery/FormsGallery'
import { KotakGallery } from './gallery/KotakGallery'
import { OverlaysGallery } from './gallery/OverlaysGallery'
import { ShellGallery } from './gallery/ShellGallery'

export function Gallery() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
      <h1 className="text-title-l">Kotak UI Gallery</h1>
      <ActionsGallery />
      <FormsGallery />
      <OverlaysGallery />
      <ShellGallery />
      <KotakGallery />
    </main>
  )
}
