import { ActionsGallery } from './gallery/ActionsGallery'

export function Gallery() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
      <h1 className="text-title-l">Kotak UI Gallery</h1>
      <ActionsGallery />
    </main>
  )
}
