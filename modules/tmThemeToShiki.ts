import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShikiTokenSettings {
  foreground?: string
  background?: string
  fontStyle?: string
}

export interface ShikiTokenColor {
  scope: string
  settings: ShikiTokenSettings
}

export interface ShikiTheme {
  name: string
  type: 'dark' | 'light'
  colors: Record<string, string>
  tokenColors: ShikiTokenColor[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractString(key: string, text: string): string | null {
  return (
    text.match(new RegExp(`<key>${key}<\\/key>\\s*<string>([\\s\\S]*?)<\\/string>`))?.[1] ?? null
  )
}

function parseDict(block: string): Record<string, string> {
  const result: Record<string, string> = {}
  const re = /<key>([\s\S]*?)<\/key>\s*<string>([\s\S]*?)<\/string>/g
  for (const m of block.matchAll(re)) result[m[1].trim()] = m[2].trim()
  return result
}

function normalizeFontStyle(raw: string): string | null {
  const v = raw.trim().replace(/\s+/g, ' ')
  return v.length ? v : null
}

function splitTopLevelDicts(text: string): string[] {
  const dicts: string[] = []
  let depth = 0
  let start = -1
  let i = 0
  while (i < text.length) {
    if (text.startsWith('<dict>', i)) {
      if (depth === 0) start = i
      depth++
      i += 6
    } else if (text.startsWith('</dict>', i)) {
      depth--
      if (depth === 0 && start !== -1) {
        dicts.push(text.slice(start, i + 7))
        start = -1
      }
      i += 7
    } else {
      i++
    }
  }
  return dicts
}

// ── Core converter ────────────────────────────────────────────────────────────

export function tmThemeToShiki(themePath: string): ShikiTheme {
  const xml = fs.readFileSync(themePath, 'utf-8')

  // 1. Name
  const name = extractString('name', xml) ?? path.basename(themePath, path.extname(themePath))

  // 2. Global editor colors
  const globalBlockMatch = xml.match(
    /<array>\s*<dict>\s*<key>settings<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<\/dict>/
  )
  const globalSettings = globalBlockMatch ? parseDict(globalBlockMatch[1]) : {}

  const colors: Record<string, string> = {}
  const colorKeyMap: Record<string, string> = {
    background:    'editor.background',
    foreground:    'editor.foreground',
    caret:         'editorCursor.foreground',
    selection:     'editor.selectionBackground',
    lineHighlight: 'editor.lineHighlightBackground',
    invisibles:    'editorWhitespace.foreground',
  }
  for (const [tmKey, vscKey] of Object.entries(colorKeyMap)) {
    if (globalSettings[tmKey]) colors[vscKey] = globalSettings[tmKey]
  }

  // 3. Token rules
  const arrayContent = xml.match(/<array>([\s\S]*)<\/array>/)?.[1] ?? ''
  const tokenDicts = splitTopLevelDicts(arrayContent).slice(1) // skip global settings dict

  const tokenColors: ShikiTokenColor[] = []

  for (const block of tokenDicts) {
    const scopeMatch = block.match(/<key>scope<\/key>\s*<string>([\s\S]*?)<\/string>/)
    if (!scopeMatch) continue
    const scope = scopeMatch[1].trim()

    const settingsBlock =
      block.match(/<key>settings<\/key>\s*<dict>([\s\S]*?)<\/dict>/)?.[1] ?? ''

    const fg   = settingsBlock.match(/<key>foreground<\/key>\s*<string>([\s\S]*?)<\/string>/)?.[1]?.trim()
    const bg   = settingsBlock.match(/<key>background<\/key>\s*<string>([\s\S]*?)<\/string>/)?.[1]?.trim()
    const font = settingsBlock.match(/<key>fontStyle<\/key>\s*<string>([\s\S]*?)<\/string>/)?.[1]

    const settings: ShikiTokenSettings = {}
    if (fg) settings.foreground = fg
    if (bg) settings.background = bg
    const fs_ = font != null ? normalizeFontStyle(font) : null
    if (fs_) settings.fontStyle = fs_

    tokenColors.push({ scope, settings })
  }

  return { name, type: 'dark', colors, tokenColors }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
// Runs when executed directly via: node tmThemeToShiki.ts <input.tmTheme> [output.json]

const currentFile = fileURLToPath(import.meta.url)
const isMain = process.argv[1] === currentFile || process.argv[1]?.endsWith('tmThemeToShiki.ts')

if (isMain) {
  const inputArg = process.argv[2]
  if (!inputArg) {
    console.error('Usage: node tmThemeToShiki.ts <input.tmTheme> [output.json]')
    process.exit(1)
  }

  const inputPath  = path.resolve(inputArg)
  const outputPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : inputPath.replace(/\.[^.]+$/, '.json')

  const theme = tmThemeToShiki(inputPath)
  fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2), 'utf-8')
  console.log(`Converted → ${outputPath}`)
}
