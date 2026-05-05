import type { ComposerTranslation } from 'vue-i18n'
import { baseUrl, urlDownloadReleaseGithub } from './constants'

export function formatTitle(source: string, t: ComposerTranslation): string {
	const regex = /^(.*?)@([\d.]+)(?:\s*([^\s]+))?$/
	const match = source.match(regex)

	if (match) {
		const name = match[1].trim()
		const version = match[2].trim()
		const statusSymbol = match[3]

		const status = statusSymbol ? ` ${t(`status_titles.${statusSymbol}`) || statusSymbol}` : ''

		return `${name} ${version}${status}`
	}

	return source
}

export function getDownloadUrl(version: string): string {
	return urlDownloadReleaseGithub(version)
}

export function pathWithBase(path: string): string {
	return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function parseToMarkup(rawString: string): string {
	let html = rawString
		.replace(/\[([^\]@]+)@([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
	return html
}

export function randomObjectKey<T extends Record<string, unknown>>(obj: T): keyof T {
	const keys = Object.keys(obj) as (keyof T)[]
	return keys[Math.floor(Math.random() * keys.length)]
}

export function randomItem<T>(...items: { item: T; chance?: number }[]): T {
  const definedTotal = items.reduce((sum, i) => sum + (i.chance ?? 0), 0)
  const undefinedCount = items.filter(i => i.chance === undefined).length
  const remainingChance = Math.max(0, 100 - definedTotal)
  const autoChance = undefinedCount > 0 ? remainingChance / undefinedCount : 0

  const normalized = items.map(i => ({
    item: i.item,
    chance: i.chance ?? autoChance,
  }))

  const totalChance = normalized.reduce((sum, i) => sum + i.chance, 0)
  let random = Math.random() * totalChance

  for (const { item, chance } of normalized) {
    random -= chance
    if (random <= 0) return item
  }

  return normalized[normalized.length - 1].item
}

export function resolveImage(image: string | undefined, lang?: string, finisher?: string): string | undefined {
	if (!image) return undefined
	const hasExtension = /\.[a-z]+$/i.test(image)
	const filename = hasExtension ? image : `${image}_${finisher || 'thumb'}.avif`
	return `${baseUrl}images/articles/${lang ? `${lang}/` : ''}${filename}`
}

export function createArticleUrl(locale: string, article: string, section?: string, header?: string): string {
	const params = new URLSearchParams()
	params.set('t', locale)
	params.set('a', article.replace(/\s+/g, '+'))
	if (section) params.set('s', section.replace(/\s+/g, '+'))
	if (header) params.set('h', header.replace(/\s+/g, '+'))
	return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}
