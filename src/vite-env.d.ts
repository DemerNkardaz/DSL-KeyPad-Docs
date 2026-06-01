declare module '*.mdx' {
	import { DefineComponent } from 'vue';
	const component: DefineComponent;
	export default component;
	export const frontmatter: Record<string, unknown>;
	export const toc: Record<string, unknown>;
	export const readingTime: number;
}

declare module '*.svg' {
	import { FunctionalComponent, SVGAttributes } from 'vue';
	const src: FunctionalComponent<SVGAttributes>;
	export default src;
}
