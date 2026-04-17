import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import './style.css'
import './reusable.css'
import './theme-enhanced.css'

// 导入自定义组件（从上级目录的 components）
import MemberList from '../components/MemberList.vue'
import MemberCard from '../components/MemberCard.vue'
import ArticleList from '../components/ArticleList.vue'
import ArticleItem from '../components/ArticleItem.vue'
import ArticlePreference from '../components/ArticlePreference.vue'
import Footer from '../components/Footer.vue'
import NotFound from '../components/NotFound.vue'
import PWAStatus from './components/PWAStatus.vue'

// 导入原子组件
import AutoCode from '../components/atomic/AutoCode.vue'
import Dropdown from '../components/atomic/Dropdown.vue'

// 导入 Pinia
import { createPinia } from 'pinia'

// 创建 Pinia 实例
const pinia = createPinia()

export default {
  extends: DefaultTheme,

  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 添加 PWA 状态组件到布局中
      'layout-top': () => h(PWAStatus),
      'home-features-after': () => h(Footer),
      'not-found': () => h(NotFound),
    })
  },

  enhanceApp({ app, router, siteData }) {
    // 使用 Pinia
    app.use(pinia)

    // 注册 vue-tippy
    app.use(VueTippy, {
      defaultProps: {
        placement: 'bottom',
        animation: 'shift-away',
      },
    })

    // 注册全局组件
    app.component('MemberList', MemberList)
    app.component('MemberCard', MemberCard)
    app.component('ArticleList', ArticleList)
    app.component('ArticleItem', ArticleItem)
    app.component('ArticlePreference', ArticlePreference)
    app.component('Footer', Footer)
    app.component('NotFound', NotFound)
    app.component('AutoCode', AutoCode)
    app.component('Dropdown', Dropdown)

    // 注册 Service Worker（仅在生产环境）
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 检查是否为生产环境（通过检查是否运行在 localhost）
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const isDevelopment = import.meta.env?.DEV === true || (isLocalhost && window.location.port !== '')

      // 只在生产环境或明确启用 PWA 的本地环境注册 Service Worker
      if (!isDevelopment || window.location.search.includes('pwa=true')) {
        const registerSW = async () => {
          try {
            // 先检查 sw.js 是否存在
            const swResponse = await fetch('/sw.js', { method: 'HEAD' })
            if (!swResponse.ok) {
              console.log('Service Worker 文件不存在，跳过注册')
              return
            }

            const registration = await navigator.serviceWorker.register('/sw.js')
            console.log('Service Worker 注册成功:', registration)

            // 检查更新
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (!newWorker) return

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 发现新版本，发送消息到页面
                  window.postMessage({
                    type: 'SW_UPDATE',
                    registration,
                    update: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                      window.location.reload()
                    },
                  }, '*')
                }
              })
            })

            // 定期检查更新（每30分钟）
            setInterval(() => {
              registration.update()
            }, 30 * 60 * 1000)

          } catch (error) {
            console.log('Service Worker 注册失败（这在开发环境是正常的）:', error)
          }
        }

        // 页面加载完成后注册
        if (document.readyState === 'complete') {
          registerSW()
        } else {
          window.addEventListener('load', registerSW)
        }

        // 监听 Service Worker 消息
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATE') {
            console.log('Service Worker 更新可用')
          }
        })
      } else {
        console.log('开发模式：跳过 Service Worker 注册')
      }
    }

    // 路由守卫 - 用于 PWA 离线状态下的导航处理
    router.onBeforeRouteChange = () => {
      return true
    }

    // 路由错误处理
    router.onAfterRouteChanged = () => {
      // 页面切换完成后，确保离线页面正确显示
      if (typeof window !== 'undefined' && !navigator.onLine) {
        setTimeout(() => {
          const content = document.querySelector('.VPContent')
          if (content && !content.innerHTML.trim()) {
            console.log('离线状态下页面内容为空，尝试恢复...')
          }
        }, 100)
      }
    }
  },
} as Theme
