import { shellText } from '../i18n/messages/shell'
import { useText } from '../i18n/text'

// Stand-in content until each view's issue replaces it.
export function ViewPlaceholder({ title, issue }: { title: string; issue: number }) {
  const t = useText(shellText)

  return (
    <section className="space-y-2">
      <h1 className="text-title-l text-text-primary">{title}</h1>
      <p className="text-body-m text-text-muted">{t.placeholder.body(issue)}</p>
    </section>
  )
}
