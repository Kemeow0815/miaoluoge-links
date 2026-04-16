import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

const RESULTS = {
  success: [],
  failed: [],
  skipped: [],
};

/**
 * 读取 members.json 获取所有 RSS 源
 */
function getRSSSources() {
  try {
    const data = fs.readFileSync(MEMBERS_FILE, "utf-8");
    const members = JSON.parse(data);
    return members
      .filter((m) => m.feed && m.feed.trim() !== "")
      .map((m) => ({
        name: m.name,
        feed: m.feed,
        website: m.website,
        avatar: m.avatar,
        avatarType: m.avatarType,
      }));
  } catch (error) {
    console.error("❌ 读取 members.json 失败:", error.message);
    process.exit(1);
  }
}

/**
 * 获取单个 RSS 源的文章（带超时）
 */
async function fetchRSS(source) {
  // 创建带超时的 parser
  const rssParser = new Parser({
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RSS Fetcher/1.0)",
    },
  });

  try {
    console.log(`📡 正在获取: ${source.name} - ${source.feed}`);

    // 使用 Promise.race 实现超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 10000ms")), 10000);
    });

    const feed = await Promise.race([
      rssParser.parseURL(source.feed),
      timeoutPromise,
    ]);

    const articles = feed.items.slice(0, 10).map((item, index) => ({
      _id: `${source.name}-${index}-${Date.now()}`,
      id: item.guid || item.link || `${source.name}-${index}`,
      title: item.title || "无标题",
      link: item.link || "",
      date: item.isoDate || item.pubDate || new Date().toISOString(),
      author: source.name,
      summary: item.contentSnippet || item.content?.substring(0, 200) || "",
      source: {
        name: source.name,
        website: source.website,
        avatar: source.avatar,
        avatarType: source.avatarType,
      },
    }));

    RESULTS.success.push({ name: source.name, count: articles.length });
    console.log(`✅ ${source.name}: 获取到 ${articles.length} 篇文章`);
    return articles;
  } catch (error) {
    RESULTS.failed.push({ name: source.name, error: error.message });
    console.error(`❌ ${source.name}: 获取失败 - ${error.message}`);
    return [];
  }
}

/**
 * 保存文章到 JSON 文件
 */
function saveArticles(allArticles) {
  try {
    // 按日期排序（最新的在前）
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    const data = {
      lastUpdated: new Date().toISOString(),
      total: allArticles.length,
      articles: allArticles,
    };

    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`\n💾 已保存 ${allArticles.length} 篇文章到 articles.json`);
  } catch (error) {
    console.error("❌ 保存文章失败:", error.message);
    process.exit(1);
  }
}

/**
 * 打印执行报告
 */
function printReport() {
  console.log("\n" + "=".repeat(50));
  console.log("📊 RSS 获取报告");
  console.log("=".repeat(50));
  console.log(`✅ 成功: ${RESULTS.success.length} 个源`);
  RESULTS.success.forEach((s) => console.log(`   - ${s.name}: ${s.count} 篇`));

  if (RESULTS.failed.length > 0) {
    console.log(`\n❌ 失败: ${RESULTS.failed.length} 个源`);
    RESULTS.failed.forEach((f) => console.log(`   - ${f.name}: ${f.error}`));
  }

  console.log("=".repeat(50));
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始获取 RSS 文章...\n");

  const sources = getRSSSources();
  console.log(`📋 发现 ${sources.length} 个 RSS 源\n`);

  if (sources.length === 0) {
    console.log("⚠️ 没有找到有效的 RSS 源");
    return;
  }

  const allArticles = [];

  // 串行获取，避免并发过多
  for (const source of sources) {
    const articles = await fetchRSS(source);
    allArticles.push(...articles);
    // 添加延迟，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  saveArticles(allArticles);
  printReport();
}

// 执行主函数并确保进程退出
main()
  .then(() => {
    console.log("\n✨ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 程序异常:", error);
    process.exit(1);
  });
