import { visit } from 'unist-util-visit';
import { typographyRules } from './typographyRules';
import type { Root, Text, Parent, Node } from 'mdast';

const NODE_MARKER = '\uE000\uEDFD\uF43E';
const PROTECTION_MARKER = '\uE001\uEDF1\uF111';

const PROTECTED_PATTERNS = [
  /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g, // E-mail
  /https?:\/\/[^\s]+/g,                               // URL
  /\/[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+/g,               // Пути к файлам
];

export function remarkTypography(options: { locale?: 'ru' | 'en' } = { locale: 'ru' }) {
  return (tree: Root) => {
    const locale = options.locale as keyof typeof typographyRules;
    const rules = [
      ...(typographyRules.common || []),
      ...(typographyRules[locale] || [])
    ];

    if (rules.length === 0) return;

    function applyRules(text: string): string {
      let value = text;
      const protectedMatches: string[] = [];
      
      PROTECTED_PATTERNS.forEach(regex => {
        value = value.replace(regex, (match) => {
          protectedMatches.push(match);
          return PROTECTION_MARKER;
        });
      });

      for (const [pattern, replacement] of rules) {
        if (pattern instanceof RegExp) {
          value = value.replace(pattern, replacement);
        } else if (typeof pattern === 'function') {
          value = pattern(value);
        }
      }

      return value.replace(new RegExp(PROTECTION_MARKER, 'g'), () => protectedMatches.shift() || '');
    }

    function collectTextNodes(node: Node, nodes: Text[] = []): Text[] {
      if (node.type === 'text') {
        nodes.push(node as Text);
      } else if ('children' in node) {
        (node.children as Node[]).forEach(child => collectTextNodes(child, nodes));
      }
      return nodes;
    }

    const isExcluded = (node: any) => (
      ['code', 'fence', 'codeBlock', 'pre', 'inlineCode', 'math'].includes(node.type)
    );
    
    visit(tree, (node) => {
      if (!('children' in node) || isExcluded(node)) return;
      
      const parent = node as Parent;
      const textNodes = collectTextNodes(parent);

      if (textNodes.length === 0) return;

      const combinedText = textNodes.map(n => n.value).join(NODE_MARKER);
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