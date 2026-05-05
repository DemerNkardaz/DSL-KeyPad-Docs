export function remarkReadingTimeExport() {
	return (tree: any, file: any) => {
		const text = file.value as string

		const cleanText = text
			.replace(/---[\s\S]*?---/, '')
			.replace(/import\s+.*from\s+['"].*['"]/g, '')
			.replace(/<[^>]*>/g, ' ')

		const chars = cleanText.trim().length
		const minutes = chars / 1000

		tree.children.unshift({
			type: 'mdxjsEsm',
			value: '',
			data: {
				estree: {
					type: 'Program',
					body: [{
						type: 'ExportNamedDeclaration',
						specifiers: [],
						declaration: {
							type: 'VariableDeclaration',
							kind: 'const',
							declarations: [{
								type: 'VariableDeclarator',
								id: { type: 'Identifier', name: 'readingTime' },
								init: { type: 'Literal', value: minutes }
							}]
						}
					}]
				}
			}
		})
	}
}
