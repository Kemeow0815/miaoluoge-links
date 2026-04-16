import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");
const RSS_OUTPUT_FILE = path.join(
	__dirname,
	"../../docs/.vitepress/public/feed.xml",
);

// RSS 配置
const RSS_CONFIG = {
	title: "克喵の友链屋 - 文章聚合",
	description: "收录众多优秀个人博客的文章聚合",
	link: "https://www.268682.xyz",
	language: "zh-CN",
	copyright: `© ${new Date().getFullYear()} 克喵の友链屋`,
	author: {
		name: "克喵の友链屋",
		email: "",
	},
	maxItems: 50, // RSS 中最多显示的文章数
};

/**
 * 读取文章数据
 */
function getArticles() {
	try {
		const data = fs.readFileSync(ARTICLES_FILE, "utf-8");
		const json = JSON.parse(data);
		return json.articles || [];
	} catch (error) {
		console.error("❌ 读取 articles.json 失败:", error.message);
		return [];
	}
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str) {
	if (!str) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * 生成 RSS XML
 */
function generateRSS(articles) {
	const now = new Date().toUTCString();

	let itemsXml = "";

	for (const article of articles.slice(0, RSS_CONFIG.maxItems)) {
		const title = escapeXml(article.title);
		const link = escapeXml(article.link);
		const description = escapeXml(article.summary || "");
		const author = escapeXml(article.author);
		const pubDate = new Date(article.date).toUTCString();
		const guid = article.id || article.link;

		itemsXml += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <author>${author}</author>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${guid}</guid>
      <source url="${escapeXml(article.source?.website || "")}">${escapeXml(article.source?.name || article.author)}</source>
    </item>`;
	}

	const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${RSS_CONFIG.title}</title>
    <link>${RSS_CONFIG.link}</link>
    <description>${RSS_CONFIG.description}</description>
    <language>${RSS_CONFIG.language}</language>
    <copyright>${RSS_CONFIG.copyright}</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${RSS_CONFIG.link}/feed.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

	return rssXml;
}

/**
 * 保存 RSS 文件
 */
function saveRSS(rssXml) {
	try {
		// 确保输出目录存在
		const outputDir = path.dirname(RSS_OUTPUT_FILE);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		fs.writeFileSync(RSS_OUTPUT_FILE, rssXml, "utf-8");
		console.log(`✅ RSS 文件已保存到 ${RSS_OUTPUT_FILE}`);
		return true;
	} catch (error) {
		console.error("❌ 保存 RSS 文件失败:", error.message);
		return false;
	}
}

/**
 * 主函数
 */
async function main() {
	console.log("🚀 开始生成 RSS Feed...\n");

	const articles = getArticles();
	console.log(`📋 读取到 ${articles.length} 篇文章`);

	if (articles.length === 0) {
		console.log("⚠️ 没有文章数据，跳过生成");
		return;
	}

	console.log("📝 生成 RSS XML...");
	const rssXml = generateRSS(articles);

	console.log("💾 保存 RSS 文件...");
	if (saveRSS(rssXml)) {
		console.log(`\n✅ RSS 生成成功！`);
		console.log(`   订阅地址: ${RSS_CONFIG.link}/feed.xml`);
		console.log(
			`   文章数量: ${Math.min(articles.length, RSS_CONFIG.maxItems)}`,
		);
	}
}

main()
	.then(() => {
		console.log("\n✨ 脚本执行完成");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 程序异常:", error);
		process.exit(1);
	});
