import { visit } from 'unist-util-visit'
import { typographyRules } from './typographyRules'
import type { Root, Text, Parent } from 'mdast'

export function remarkTypography() {
	return (tree: Root, file: any) => {
		const filePath: string = file.history?.[0] ?? ''
		const locale = filePath.includes('/ru.') ? 'ru' : filePath.includes('/en.') ? 'en' : null

		if (!locale) return
		const rules = typographyRules[locale]
		if (!rules || rules.length === 0) return

		function applyRules(text: string): string {
			let value = text
			for (const [pattern, replacement] of rules) {
				value = value.replace(pattern, replacement)
			}
			return value
		}

		visit(tree, 'paragraph', (node: Parent) => {
			node.children.forEach((child, i) => {
				if (child.type !== 'text') return

				const prev = node.children[i - 1]
				const next = node.children[i + 1]

				const prefix = prev ? '\x00' : ''
				const suffix = next ? '\x00' : ''

				let value = prefix + (child as Text).value + suffix
				value = applyRules(value)

				if (prefix) value = value.replace(/^\x00/, '')
				if (suffix) value = value.replace(/\x00$/, '')

				;(child as Text).value = value
			})
		})
	}
}
