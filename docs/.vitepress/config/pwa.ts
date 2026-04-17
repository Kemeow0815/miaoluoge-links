import type { VitePWAOptions } from 'vite-plugin-pwa'

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'prompt',
  injectRegister: 'auto',

  // 工作箱配置
  workbox: {
    // 预缓存的文件类型
    globPatterns: [
      '**/*.{js,css,html,json,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}',
    ],
    // 最大文件大小（5MB）
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

    // 运行时缓存策略
    runtimeCaching: [
      // 页面导航 - NetworkFirst 策略
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1天
          },
          networkTimeoutSeconds: 3,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // 静态资源 - CacheFirst 策略
      {
        urlPattern: ({ request }) =>
          request.destination === 'style' ||
          request.destination === 'script' ||
          request.destination === 'font',
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // 图片资源 - CacheFirst 策略
      {
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // 外部 CDN 资源
      {
        urlPattern: ({ url }) =>
          url.origin.includes('lib.baomitu.com') ||
          url.origin.includes('rsms.me') ||
          url.origin.includes('wsrv.nl'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'cdn-resources',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // API 请求 - NetworkFirst 策略
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1小时
          },
          networkTimeoutSeconds: 3,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // JSON 数据文件
      {
        urlPattern: ({ url }) => url.pathname.endsWith('.json'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'json-data',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1天
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],

    // 跳过等待，立即激活
    skipWaiting: false,
    clientsClaim: true,

    // 清理过期缓存
    cleanupOutdatedCaches: true,
  },

  // 清单配置
  manifest: {
    name: '克喵の友链屋',
    short_name: '友链屋',
    description: '克喵の友链屋 - 收集和分享有趣的网站链接',
    theme_color: '#5f67ee',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/',
    lang: 'zh-CN',
    dir: 'ltr',
    categories: ['social', 'utilities'],

    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],

    screenshots: [
      {
        src: '/screenshots/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/screenshots/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],

    shortcuts: [
      {
        name: '成员列表',
        short_name: '成员',
        description: '查看友链成员列表',
        url: '/',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: '文章列表',
        short_name: '文章',
        description: '查看文章列表',
        url: '/article',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  },

  // 开发配置 - 禁用开发模式的 Service Worker
  devOptions: {
    enabled: false, // 开发模式禁用 Service Worker
  },

  // 策略
  strategies: 'generateSW',

  // 文件名
  filename: 'sw.js',
}
