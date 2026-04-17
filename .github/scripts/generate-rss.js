import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const RSS_OUTPUT_FILE = path.join(__dirname, "../../docs/feed.xml");

// 网站配置
const SITE_CONFIG = {
	title: "克喵の友链屋",
	description: "克喵の友链屋 - 收录优秀个人博客的聚合站点",
	link: "https://www.268682.xyz",
	language: "zh-CN",
	copyright: `© ${new Date().getFullYear()} 克喵の友链屋`,
	managingEditor: "Kemeow0815",
	webMaster: "Kemeow0815",
	ttl: 60, // 缓存时间（分钟）
};

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
 * 格式化日期为 RFC 822 格式
 */
function formatRFC822Date(dateStr) {
	const date = new Date(dateStr);
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const day = days[date.getUTCDay()];
	const month = months[date.getUTCMonth()];
	const dd = String(date.getUTCDate()).padStart(2, "0");
	const yyyy = date.getUTCFullYear();
	const hh = String(date.getUTCHours()).padStart(2, "0");
	const mm = String(date.getUTCMinutes()).padStart(2, "0");
	const ss = String(date.getUTCSeconds()).padStart(2, "0");

	return `${day}, ${dd} ${month} ${yyyy} ${hh}:${mm}:${ss} GMT`;
}

/**
 * 读取文章数据
 */
function getArticles() {
	try {
		const data = fs.readFileSync(ARTICLES_FILE, "utf-8");
		const articlesData = JSON.parse(data);
		return articlesData.articles || [];
	} catch (error) {
		console.error("❌ 读取 articles.json 失败:", error.message);
		return [];
	}
}

/**
 * 读取成员数据
 */
function getMembers() {
	try {
		const data = fs.readFileSync(MEMBERS_FILE, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		console.error("❌ 读取 members.json 失败:", error.message);
		return [];
	}
}

/**
 * 生成 RSS XML
 */
function generateRSS(articles) {
	const now = new Date().toISOString();
	const lastBuildDate = formatRFC822Date(now);

	let itemsXml = "";

	// 只取最新的 50 篇文章
	const recentArticles = articles.slice(0, 50);

	for (const article of recentArticles) {
		const title = escapeXml(article.title);
		const link = escapeXml(article.link);
		const description = escapeXml(article.summary || "");
		const author = escapeXml(article.author || "未知作者");
		const pubDate = formatRFC822Date(article.date);
		const guid = article.id || article.link;

		// 获取作者网站
		let authorLink = "";
		if (article.source && article.source.website) {
			authorLink = article.source.website;
		}

		itemsXml += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <author>${author}${authorLink ? ` (${authorLink})` : ""}</author>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${guid}</guid>
      <source url="${escapeXml(authorLink || SITE_CONFIG.link)}">${escapeXml(author)}</source>
    </item>`;
	}

	const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_CONFIG.title)}</title>
    <link>${SITE_CONFIG.link}</link>
    <description>${escapeXml(SITE_CONFIG.description)}</description>
    <language>${SITE_CONFIG.language}</language>
    <copyright>${escapeXml(SITE_CONFIG.copyright)}</copyright>
    <managingEditor>${SITE_CONFIG.managingEditor}</managingEditor>
    <webMaster>${SITE_CONFIG.webMaster}</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>${SITE_CONFIG.ttl}</ttl>
    <atom:link href="${SITE_CONFIG.link}/feed.xml" rel="self" type="application/rss+xml" />${itemsXml}
  </channel>
</rss>`;

	return rssXml;
}

/**
 * 保存 RSS 文件
 */
function saveRSS(rssXml) {
	try {
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
	console.log("🚀 开始生成 RSS 订阅源...\n");

	// 读取文章数据
	const articles = getArticles();
	console.log(`📋 读取到 ${articles.length} 篇文章`);

	if (articles.length === 0) {
		console.log("⚠️ 没有文章数据，跳过生成");
		return;
	}

	// 生成 RSS
	console.log("\n📝 生成 RSS XML...");
	const rssXml = generateRSS(articles);

	// 保存 RSS 文件
	if (saveRSS(rssXml)) {
		console.log(`\n✅ RSS 生成完成！`);
		console.log(`   文章数: ${Math.min(articles.length, 50)}`);
		console.log(`   输出文件: ${RSS_OUTPUT_FILE}`);
		console.log(`   订阅地址: ${SITE_CONFIG.link}/feed.xml`);
	} else {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("\n💥 程序异常:", error);
	process.exit(1);
});
