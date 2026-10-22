// Stand-in content until each view's issue replaces it.
export function ViewPlaceholder({ title, issue }: { title: string; issue: number }) {
  return (
    <section className="space-y-2">
      <h1 className="text-title-l text-text-primary">{title}</h1>
      <p className="text-body-m text-text-muted">This screen is being built in issue #{issue}.</p>
    </section>
  )
}
