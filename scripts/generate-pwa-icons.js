#!/usr/bin/env node

/**
 * PWA 图标生成脚本
 * 使用 Sharp 库从源图片生成各种尺寸的 PWA 图标
 * 
 * 使用方法:
 * 1. 确保已安装 sharp: pnpm add -D sharp
 * 2. 将源图片放在 docs/.vitepress/public/icon-source.png (建议 1024x1024)
 * 3. 运行: node scripts/generate-pwa-icons.js
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const sourceImage = join(__dirname, '../docs/.vitepress/public/icon-source.png')
const outputDir = join(__dirname, '../docs/.vitepress/public/icons')

async function generateIcons() {
  try {
    // 动态导入 sharp
    const sharp = await import('sharp').then(m => m.default || m)
    
    // 检查源文件是否存在
    if (!existsSync(sourceImage)) {
      console.error('❌ 错误: 源图片不存在!')
      console.log(`请放置一张 1024x1024 的图片到: ${sourceImage}`)
      console.log('可以使用你的 GitHub 头像或其他合适的图片')
      process.exit(1)
    }
    
    // 创建输出目录
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    
    console.log('🎨 正在生成 PWA 图标...')
    
    // 读取源图片
    const image = sharp(sourceImage)
    
    // 生成各种尺寸的图标
    for (const size of sizes) {
      const outputFile = join(outputDir, `icon-${size}x${size}.png`)
      
      await image
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 95, g: 103, b: 238, alpha: 1 } // #5f67ee
        })
        .png({ quality: 90 })
        .toFile(outputFile)
      
      console.log(`✅ 生成: icon-${size}x${size}.png`)
    }
    
    // 生成 maskable 图标（带安全边距）
    const maskableSize = 512
    const maskableOutput = join(outputDir, 'maskable-icon.png')
    const padding = Math.round(maskableSize * 0.1) // 10% 边距
    
    await image
      .clone()
      .resize(maskableSize - padding * 2, maskableSize - padding * 2)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 95, g: 103, b: 238, alpha: 1 }
      })
      .png({ quality: 90 })
      .toFile(maskableOutput)
    
    console.log(`✅ 生成: maskable-icon.png`)
    
    console.log('\n🎉 PWA 图标生成完成!')
    console.log(`📁 输出目录: ${outputDir}`)
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ 请先安装 sharp: pnpm add -D sharp')
      process.exit(1)
    }
    console.error('❌ 生成图标时出错:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIcons()
}

export { generateIcons }
