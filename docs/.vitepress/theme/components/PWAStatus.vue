<template>
  <Teleport to="body">
    <!-- 离线提示 -->
    <Transition name="slide-down">
      <div v-if="showOfflineAlert" class="pwa-status-alert offline-alert" role="alert" aria-live="polite">
        <div class="alert-content">
          <span class="alert-icon">📡</span>
          <span class="alert-text">您当前处于离线状态，部分功能可能受限</span>
          <button class="alert-close" @click="dismissOfflineAlert" aria-label="关闭提示">
            <span>×</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 在线恢复提示 -->
    <Transition name="slide-down">
      <div v-if="showOnlineAlert" class="pwa-status-alert online-alert" role="alert" aria-live="polite">
        <div class="alert-content">
          <span class="alert-icon">✅</span>
          <span class="alert-text">网络已恢复连接</span>
          <button class="alert-close" @click="dismissOnlineAlert" aria-label="关闭提示">
            <span>×</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Service Worker 更新提示 -->
    <Transition name="slide-up">
      <div v-if="showUpdateAlert" class="pwa-status-alert update-alert" role="alert" aria-live="polite">
        <div class="alert-content">
          <span class="alert-icon">🔄</span>
          <span class="alert-text">发现新版本，是否立即更新？</span>
          <div class="alert-actions">
            <button class="alert-btn primary" @click="updateServiceWorker">立即更新</button>
            <button class="alert-btn secondary" @click="dismissUpdateAlert">稍后</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 应用安装提示 -->
    <Transition name="slide-up">
      <div v-if="showInstallPrompt" class="pwa-status-alert install-alert" role="alert" aria-live="polite">
        <div class="alert-content">
          <span class="alert-icon">📱</span>
          <span class="alert-text">将友链屋安装到桌面，访问更便捷</span>
          <div class="alert-actions">
            <button class="alert-btn primary" @click="installApp">安装</button>
            <button class="alert-btn secondary" @click="dismissInstallPrompt">忽略</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 网络状态
const isOnline = ref(navigator.onLine)
const showOfflineAlert = ref(false)
const showOnlineAlert = ref(false)
let offlineAlertTimer: number | null = null
let onlineAlertTimer: number | null = null

// Service Worker 更新
const showUpdateAlert = ref(false)
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null
let updateSW: (() => Promise<void>) | null = null

// 安装提示
const showInstallPrompt = ref(false)
let deferredPrompt: any = null

// 监听网络状态变化
const handleOnline = () => {
  isOnline.value = true
  showOfflineAlert.value = false
  showOnlineAlert.value = true
  
  // 3秒后自动隐藏在线提示
  if (onlineAlertTimer) clearTimeout(onlineAlertTimer)
  onlineAlertTimer = window.setTimeout(() => {
    showOnlineAlert.value = false
  }, 3000)
}

const handleOffline = () => {
  isOnline.value = false
  showOnlineAlert.value = false
  showOfflineAlert.value = true
}

const dismissOfflineAlert = () => {
  showOfflineAlert.value = false
}

const dismissOnlineAlert = () => {
  showOnlineAlert.value = false
  if (onlineAlertTimer) clearTimeout(onlineAlertTimer)
}

// Service Worker 更新处理
const handleSWUpdate = (registration: ServiceWorkerRegistration, updateFn: () => Promise<void>) => {
  serviceWorkerRegistration = registration
  updateSW = updateFn
  showUpdateAlert.value = true
}

const updateServiceWorker = async () => {
  if (updateSW) {
    await updateSW()
  }
  showUpdateAlert.value = false
}

const dismissUpdateAlert = () => {
  showUpdateAlert.value = false
}

// 应用安装处理
const handleBeforeInstallPrompt = (e: Event) => {
  // 阻止默认提示
  e.preventDefault()
  // 保存事件以便稍后触发
  deferredPrompt = e
  // 显示自定义安装提示
  showInstallPrompt.value = true
}

const installApp = async () => {
  if (!deferredPrompt) return
  
  // 显示安装提示
  deferredPrompt.prompt()
  
  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('用户接受了安装提示')
  } else {
    console.log('用户拒绝了安装提示')
  }
  
  // 清除保存的提示
  deferredPrompt = null
  showInstallPrompt.value = false
}

const dismissInstallPrompt = () => {
  showInstallPrompt.value = false
  // 设置标记，不再显示安装提示
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

// 检查是否应该显示安装提示
const shouldShowInstallPrompt = () => {
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (!dismissed) return true
  
  // 如果上次忽略超过7天，再次显示
  const dismissedTime = parseInt(dismissed)
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - dismissedTime > sevenDays
}

onMounted(() => {
  // 添加网络状态监听
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 添加安装提示监听
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // 检查初始网络状态
  if (!navigator.onLine) {
    showOfflineAlert.value = true
  }
  
  // 注册 Service Worker 更新回调
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // 监听来自 Service Worker 的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE') {
        const { registration, update } = event.data
        handleSWUpdate(registration, update)
      }
    })
  }
  
  // 延迟检查安装提示（避免页面加载时立即显示）
  setTimeout(() => {
    if (shouldShowInstallPrompt() && !window.matchMedia('(display-mode: standalone)').matches) {
      // 如果已经满足安装条件但还没显示，等待 beforeinstallprompt 事件
    }
  }, 5000)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  if (offlineAlertTimer) clearTimeout(offlineAlertTimer)
  if (onlineAlertTimer) clearTimeout(onlineAlertTimer)
})
</script>

<style scoped>
.pwa-status-alert {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 90vw;
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pwa-status-alert.offline-alert,
.pwa-status-alert.online-alert {
  top: 20px;
}

.pwa-status-alert.update-alert,
.pwa-status-alert.install-alert {
  bottom: 20px;
}

.offline-alert {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

.online-alert {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
}

.update-alert {
  background: linear-gradient(135deg, #5f67ee 0%, #4c54d8 100%);
  color: white;
}

.install-alert {
  background: linear-gradient(135deg, #339af0 0%, #228be6 100%);
  color: white;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.alert-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.alert-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  padding-left: 32px;
}

.alert-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.alert-btn.primary {
  background: white;
  color: #333;
}

.alert-btn.primary:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.alert-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.alert-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 深色模式适配 */
:root.dark .offline-alert {
  background: linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%);
}

:root.dark .online-alert {
  background: linear-gradient(135deg, #2f9e44 0%, #2b8a3e 100%);
}

:root.dark .update-alert {
  background: linear-gradient(135deg, #4c54d8 0%, #3d44b0 100%);
}

:root.dark .install-alert {
  background: linear-gradient(135deg, #1971c2 0%, #1864ab 100%);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .pwa-status-alert {
    width: calc(100vw - 32px);
    left: 16px;
    right: 16px;
    transform: none;
  }
  
  .alert-content {
    padding: 12px 16px;
  }
  
  .alert-actions {
    padding-left: 0;
    margin-top: 12px;
  }
}
</style>
