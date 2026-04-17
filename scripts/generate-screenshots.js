#!/usr/bin/env node

/**
 * PWA 截图生成脚本
 * 使用 Puppeteer 自动生成 PWA 截图
 * 
 * 使用方法:
 * 1. 确保已安装 puppeteer: pnpm add -D puppeteer
 * 2. 运行开发服务器: pnpm dev
 * 3. 运行: node scripts/generate-screenshots.js
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const screenshotsDir = join(__dirname, '../docs/.vitepress/public/screenshots')
const baseUrl = 'http://localhost:5173' // VitePress 默认端口

const screenshots = [
  {
    name: 'screenshot-wide.png',
    width: 1280,
    height: 720,
    path: '/',
    formFactor: 'wide'
  },
  {
    name: 'screenshot-narrow.png',
    width: 750,
    height: 1334,
    path: '/',
    formFactor: 'narrow',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  }
]

async function generateScreenshots() {
  try {
    // 动态导入 puppeteer
    const puppeteer = await import('puppeteer').then(m => m.default || m)
    
    // 创建输出目录
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true })
    }
    
    console.log('📸 正在启动浏览器...')
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    console.log('🎨 正在生成 PWA 截图...\n')
    
    for (const config of screenshots) {
      console.log(`📱 生成 ${config.formFactor} 截图 (${config.width}x${config.height})...`)
      
      const page = await browser.newPage()
      
      // 设置视口
      await page.setViewport({
        width: config.width,
        height: config.height,
        deviceScaleFactor: config.formFactor === 'narrow' ? 2 : 1
      })
      
      // 设置移动端 User Agent
      if (config.userAgent) {
        await page.setUserAgent(config.userAgent)
      }
      
      try {
        // 访问页面
        await page.goto(`${baseUrl}${config.path}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        })
        
        // 等待内容加载
        await page.waitForSelector('.VPContent', { timeout: 10000 })
        
        // 额外等待动画完成
        await page.waitForTimeout(2000)
        
        // 截图
        const outputPath = join(screenshotsDir, config.name)
        await page.screenshot({
          path: outputPath,
          fullPage: false
        })
        
        console.log(`✅ 已保存: ${config.name}`)
        
      } catch (error) {
        console.error(`❌ 生成 ${config.name} 失败:`, error.message)
      } finally {
        await page.close()
      }
    }
    
    await browser.close()
    
    console.log('\n🎉 PWA 截图生成完成!')
    console.log(`📁 输出目录: ${screenshotsDir}`)
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ 请先安装 puppeteer: pnpm add -D puppeteer')
      console.log('或者手动截图并放置到:')
      console.log('  - docs/.vitepress/public/screenshots/screenshot-wide.png (1280x720)')
      console.log('  - docs/.vitepress/public/screenshots/screenshot-narrow.png (750x1334)')
      process.exit(1)
    }
    console.error('❌ 生成截图时出错:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateScreenshots()
}

export { generateScreenshots }
