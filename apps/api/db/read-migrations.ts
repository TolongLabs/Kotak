// Every migration file in file order, split into the statements migrate.ts sends: comment lines are dropped, and a
// statement ends at a semicolon that ends a line. The tests build their database from the same statements.
export async function readMigrations() {
  const files = [...new Bun.Glob('migrations/*.sql').scanSync({ cwd: import.meta.dir, absolute: true })].sort()
  return Promise.all(
    files.map(async (file) => ({
      file,
      statements: (await Bun.file(file).text())
        .replace(/^\s*--.*$/gm, '')
        .split(/;\s*$/m)
        .map((statement) => statement.trim())
        .filter(Boolean)
    }))
  )
}
