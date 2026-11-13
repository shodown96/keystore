export type EnvPair = { key: string; value: string }

/** Parses KEY=value lines (supports `export`, quotes, comments). */
export function parseDotenv(input: string): EnvPair[] {
  const pairs: EnvPair[] = []
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.match(/^(?:export\s+)?([\w.-]+)\s*[=:]\s*(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    const quote = value[0]
    if ((quote === '"' || quote === "'" || quote === "`") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1)
      if (quote === '"') value = value.replace(/\\([n"\\])/g, (_, c) => (c === "n" ? "\n" : c))
    } else {
      value = value.replace(/\s+#.*$/, "")
    }
    pairs.push({ key: match[1], value })
  }
  return pairs
}

export function toDotenv(pairs: EnvPair[]): string {
  return (
    pairs
      .map(({ key, value }) => {
        const needsQuotes = /[\s#"'\\]/.test(value) || value.includes("\n")
        const v = needsQuotes ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"` : value
        return `${key}=${v}`
      })
      .join("\n") + "\n"
  )
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
