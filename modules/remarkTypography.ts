import { visit } from 'unist-util-visit';
import { typographyRules, type Rule } from './typographyRules';
import type { Root, Text, Parent } from 'mdast';

const NODE_MARKER = '\uE000\uEDFD\uF43E';

export function remarkTypography(options: { locale?: 'ru' | 'en' } = { locale: 'ru' }) {
	return (tree: Root) => {
		const locale = options.locale as keyof typeof typographyRules;
		const rules = [...(typographyRules.common || []), ...(typographyRules[locale] || [])];

		if (rules.length === 0) return;

		function applyRules(text: string): string {
			let value = text;
			for (const [pattern, replacement] of rules) {
				if (pattern instanceof RegExp) {
					value = value.replace(pattern, replacement);
				} else if (typeof pattern === 'function') {
					value = pattern(value);
				}
			}
			return value;
		}

		const isExcluded = (node: any) =>
			node.type === 'code' ||
			node.type === 'fence' ||
			node.type === 'codeBlock' ||
			node.type === 'pre' ||
			node.type === 'inlineCode' ||
			node.type === 'math';

		visit(tree, (node) => {
			if (!('children' in node)) return;

			const parent = node as Parent;
			if (isExcluded(node) || (parent && isExcluded(parent))) return;

			const textNodes: Text[] = [];

			parent.children.forEach((child) => {
				if (child.type === 'text') {
					textNodes.push(child as Text);
				}
			});

			if (textNodes.length === 0) return;

			const combinedText = textNodes.map((n) => n.value).join(NODE_MARKER);

			const transformedText = applyRules(combinedText);

			const segments = transformedText.split(NODE_MARKER);

			textNodes.forEach((node, i) => {
				if (segments[i] !== undefined) {
					node.value = segments[i];
				}
			});
		});
	};
}
