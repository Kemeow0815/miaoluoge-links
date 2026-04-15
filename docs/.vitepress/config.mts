import type { DefaultTheme } from 'vitepress'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

// https://vitepress.dev/zh/reference/site-config
export default defineConfig({
	lang: 'zh',
	title: '克喵の友链屋',
	titleTemplate: '克喵の友链屋 (KeMiao links Hub)',
	description: '克喵の友链屋',
	lastUpdated: true,
	// cleanUrls: true,

	themeConfig: {
		// https://vitepress.dev/zh/reference/default-theme-config
		logo: 'https://wsrv.nl/?url=github.com%2FKemeow0815.png',
		// siteTitle: '',
		nav: nav(),
		sidebar: sidebar(),
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/Kemeow0815' },
		],

		externalLinkIcon: true,
		langMenuLabel: '切换语言',
		darkModeSwitchLabel: '主题',
		lightModeSwitchTitle: '切换到浅色模式',
		darkModeSwitchTitle: '切换到深色模式',
		sidebarMenuLabel: '菜单',
		outline: { level: [2, 3], label: '目录' },
		returnToTopLabel: '返回顶部',
		editLink: {
			pattern: 'https://github.com/Kemeow0815/miaoluoge-links/blame/main/docs/:path',
			text: '源代码',
		},
		lastUpdated: {
			text: '更新于',
			formatOptions: { dateStyle: 'short', timeStyle: 'medium' },
		},
		docFooter: { prev: '上一篇', next: '下一篇' },

		footer: {
			message: '<a href="https://github.com/Kemeow0815/miaoluoge-links" target="_blank"><i class="fa-brands fa-github-alt"></i>网站仓库</a>',
			copyright: `© ${new Date().getFullYear()} 克喵の友链屋 (KeMiao links Hub)`,
		},
	},

	head: [
		['link', { rel: 'icon', href: 'https://wsrv.nl/?url=github.com%2FKemeow0815.png' }],
		['link', { rel: 'stylesheet', href: 'https://lib.baomitu.com/font-awesome/7.0.0/css/all.min.css', media: 'none', onload: 'media="all"' }],
		['link', { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', media: 'print', onload: 'this.media="all"' }],
	],

	vite: {
		resolve: {
			alias: {
				'@': dirname(fileURLToPath(import.meta.url)),
			},
		},
		server: {
			allowedHosts: true,
		},
	},
})

function nav(): DefaultTheme.NavItem[] {
	return [
		{ text: '成员', link: '/' },
		{ text: '文章', link: '/article' },
		// { text: '小说', link: 'https://novel.afhub.top/' },
	]
}

function sidebar(): DefaultTheme.Sidebar {
	return [

	]
}
