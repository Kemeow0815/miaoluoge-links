#!/usr/bin/env node

/**
 * PWA 图标生成脚本
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = join(
	__dirname,
	"../docs/.vitepress/public/icon-source.png",
);
const outputDir = join(__dirname, "../docs/.vitepress/public/icons");

async function generateIcons() {
	try {
		const sharp = await import("sharp").then((m) => m.default || m);

		if (!existsSync(sourceImage)) {
			console.error("❌ 错误: 源图片不存在:", sourceImage);
			process.exit(1);
		}

		// 创建输出目录
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		console.log("🎨 正在生成 PWA 图标...");

		// 读取源图片
		const image = sharp(sourceImage);

		// 获取源图片信息
		const metadata = await image.metadata();
		console.log(`📷 源图片尺寸: ${metadata.width}x${metadata.height}`);

		// 生成各种尺寸的图标
		for (const size of sizes) {
			const outputFile = join(outputDir, `icon-${size}x${size}.png`);

			await image
				.clone()
				.resize(size, size, {
					fit: "cover",
					position: "center",
				})
				.png({ quality: 90 })
				.toFile(outputFile);

			console.log(`✅ 生成: icon-${size}x${size}.png`);
		}

		console.log("\n🎉 PWA 图标生成完成!");
		console.log(`📁 输出目录: ${outputDir}`);
	} catch (error) {
		console.error("❌ 生成图标时出错:", error);
		process.exit(1);
	}
}

generateIcons();
