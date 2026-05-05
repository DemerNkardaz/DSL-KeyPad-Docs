import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkExtractToc from 'remark-extract-toc'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import mdx from '@mdx-js/rollup'
import svgLoader from 'vite-svg-loader'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vue from '@vitejs/plugin-vue'
import rehypeShiki from '@shikijs/rehype'

import remarkReadingTime from 'remark-reading-time'
import { transformerRenderIndentGuides } from '@shikijs/transformers'

import { remarkReadingTimeExport } from './modules/remarkReadingTimeExport'
import { remarkTypography } from './modules/remarkTypography'
import { tmThemeToShiki } from './modules/tmThemeToShiki'

import ahk2Grammar from './src/assets/grammars/ahk2.tmLanguage.json'
const themePath = './src/assets/themes/DSL-KeyPad.tmTheme'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		{
			name: 'watch-tm-theme',
			configureServer(server) {
				server.watcher.add('**/*.tmTheme')

				let timer: ReturnType<typeof setTimeout> | null = null
				server.watcher.on('change', (file) => {
					if (!file.endsWith('.tmTheme')) return
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => {
						timer = null
						server.restart()
					}, 300)
				})
			}
		},
		{
			enforce: 'pre', ...mdx({
			jsxImportSource: 'vue',
			remarkPlugins: [
				remarkFrontmatter,
				[remarkMdxFrontmatter, { name: 'frontmatter' }],
				remarkGfm,
				[remarkExtractToc, { name: 'toc', keys: ['value', 'depth', 'data'] }],
				remarkReadingTime,
				remarkReadingTimeExport,
				remarkTypography,
			],
			rehypePlugins: [
				rehypeSlug,
				rehypeAutolinkHeadings,
				[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
				[rehypeShiki, {
					theme: tmThemeToShiki(themePath),
					transformers: [
						transformerRenderIndentGuides(),
					],
					langs: [
						'javascript',
						'json',
						'jsonc',
						'ini',
						{
							...ahk2Grammar,
							name: 'ahk2',
							alias: ['autohotkey2']
						}
					],
					inline: 'tailing-curly-colon',
				}],
			]
		}), },
		vue(),
		vueJsx(),
		svgLoader(),
	],
	base: '/DSL-KeyPad-Docs/',
	server: {
		open: true
	},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@/styles/variables.scss" as *;`
			}
		}
	}
})
