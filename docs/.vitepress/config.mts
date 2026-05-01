import type { DefaultTheme } from 'vitepress'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitepress'
import { pwaConfig } from './config/pwa'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitepress.dev/zh/reference/site-config
export default defineConfig({
	lang: 'zh',
	title: '克喵の友链屋',
	titleTemplate: '克喵の友链屋 (KeMiao links Hub)',
	description: '克喵の友链屋 - 收集和分享有趣的网站链接',
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
			{ icon: 'telegram', link: 'https://t.me/Kemeow0815' },
			{ icon: 'qq', link: 'https://qm.qq.com/q/5Uygyalp1m' },
			{
				icon: {
					svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Email</title><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
				},
				link: 'mailto:mcy@kemiaosw.top',
				ariaLabel: 'Email',
			},
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
		// 基础图标
		['link', { rel: 'icon', href: 'https://wsrv.nl/?url=github.com%2FKemeow0815.png' }],
		['link', { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' }],

		// PWA Manifest
		['link', { rel: 'manifest', href: '/manifest.json' }],

		// 主题颜色
		['meta', { name: 'theme-color', content: '#5f67ee' }],
		['meta', { name: 'msapplication-TileColor', content: '#5f67ee' }],
		['meta', { name: 'msapplication-config', content: '/browserconfig.xml' }],

		// PWA 相关元数据
		['meta', { name: 'application-name', content: '克喵の友链屋' }],
		['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
		['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }],
		['meta', { name: 'apple-mobile-web-app-title', content: '友链屋' }],
		['meta', { name: 'format-detection', content: 'telephone=no' }],
		['meta', { name: 'mobile-web-app-capable', content: 'yes' }],

		// 视口优化
		['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes' }],

		// SEO 描述
		['meta', { name: 'description', content: '克喵の友链屋 - 收集和分享有趣的网站链接' }],
		['meta', { name: 'keywords', content: '友链, 友情链接, 网站收藏, 克喵' }],

		// Open Graph
		['meta', { property: 'og:type', content: 'website' }],
		['meta', { property: 'og:title', content: '克喵の友链屋' }],
		['meta', { property: 'og:description', content: '克喵の友链屋 - 收集和分享有趣的网站链接' }],
		['meta', { property: 'og:image', content: '/icons/icon-512x512.png' }],

		// Twitter Card
		['meta', { name: 'twitter:card', content: 'summary_large_image' }],
		['meta', { name: 'twitter:title', content: '克喵の友链屋' }],
		['meta', { name: 'twitter:description', content: '克喵の友链屋 - 收集和分享有趣的网站链接' }],
		['meta', { name: 'twitter:image', content: '/icons/icon-512x512.png' }],

		// 外部样式表
		['link', { rel: 'stylesheet', href: 'https://lib.baomitu.com/font-awesome/7.0.0/css/all.min.css', media: 'none', onload: 'media="all"' }],
		['link', { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', media: 'print', onload: 'this.media="all"' }],

		// 预连接优化
		['link', { rel: 'preconnect', href: 'https://lib.baomitu.com' }],
		['link', { rel: 'preconnect', href: 'https://rsms.me' }],
		['link', { rel: 'preconnect', href: 'https://wsrv.nl' }],
		['link', { rel: 'dns-prefetch', href: 'https://lib.baomitu.com' }],
		['link', { rel: 'dns-prefetch', href: 'https://rsms.me' }],
		['link', { rel: 'dns-prefetch', href: 'https://wsrv.nl' }],
	],

	vite: {
		plugins: [
			// PWA 插件
			VitePWA(pwaConfig),
		],
		resolve: {
			alias: {
				'@': resolve(__dirname),
			},
		},
		server: {
			allowedHosts: true,
		},
		build: {
			assetsInlineLimit: 0,
		},
		// 优化依赖预构建
		optimizeDeps: {
			include: ['vue', '@vueuse/core', 'pinia'],
		},
	},

	// 忽略死链检查（某些动态路由可能导致）
	ignoreDeadLinks: true,
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
