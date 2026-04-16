import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");

// 从环境变量获取 GitHub 信息
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_TITLE = process.env.ISSUE_TITLE;
const ISSUE_BODY = process.env.ISSUE_BODY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// 检测配置
const CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  requestTimeout: 10000,
};

/**
 * 解析议题内容，提取表单数据
 */
function parseIssueBody(body) {
  const data = {};

  // 使用正则表达式提取各个字段
  const patterns = {
    name: /### 用户昵称\s*\n\s*([^\n]+)/,
    title: /### 博客名称\s*\n\s*([^\n]+)/,
    desc: /### 博客\/用户介绍\s*\n\s*([^#]+?)(?=###|$)/,
    avatarType: /### 头像类型\s*\n\s*([^\n]+)/,
    avatar: /### 头像标识\s*\n\s*([^\n]+)/,
    github: /### GitHub 用户名\s*\n\s*([^\n#]+)?/,
    website: /### 博客链接\s*\n\s*([^\n]+)/,
    feed: /### 博客 RSS 订阅链接\s*\n\s*([^\n#]+)?/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = body.match(pattern);
    if (match && match[1]) {
      data[key] = match[1].trim();
    } else {
      data[key] = "";
    }
  }

  return data;
}

/**
 * 验证必填字段
 */
function validateData(data) {
  const required = ["name", "title", "desc", "avatarType", "avatar", "website"];
  const missing = [];

  for (const field of required) {
    if (!data[field] || data[field].trim() === "") {
      missing.push(field);
    }
  }

  // 验证 avatarType
  const validAvatarTypes = ["qq", "github", "url"];
  if (!validAvatarTypes.includes(data.avatarType)) {
    return { valid: false, error: `头像类型必须是: ${validAvatarTypes.join(", ")}` };
  }

  // 验证 website 是有效的 URL
  if (!data.website.startsWith("http://") && !data.website.startsWith("https://")) {
    return { valid: false, error: "博客链接必须以 http:// 或 https:// 开头" };
  }

  if (missing.length > 0) {
    return { valid: false, error: `缺少必填字段: ${missing.join(", ")}` };
  }

  return { valid: true };
}

/**
 * 检测网站是否可访问
 */
function checkWebsite(url) {
  return new Promise((resolve) => {
    if (!url || url.trim() === "") {
      resolve({ success: true, message: "No URL provided" });
      return;
    }

    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, { timeout: CONFIG.requestTimeout }, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        success,
        statusCode: res.statusCode,
        message: success ? "OK" : `HTTP ${res.statusCode}`,
      });
    });

    req.on("error", (error) => {
      resolve({
        success: false,
        statusCode: null,
        message: error.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: null,
        message: "Request timeout",
      });
    });
  });
}

/**
 * 多次尝试检测网站
 */
async function checkWithRetries(url, name) {
  console.log(`🔍 检测网站: ${name} - ${url}`);

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    console.log(`  尝试 ${attempt}/${CONFIG.maxRetries}...`);

    const result = await checkWebsite(url);

    if (result.success) {
      console.log(`  ✅ 成功 (${result.statusCode || "N/A"})`);
      return { success: true, attempts: attempt };
    }

    console.log(`  ❌ 失败: ${result.message}`);

    if (attempt < CONFIG.maxRetries) {
      console.log(`  ⏳ 等待 ${CONFIG.retryDelay}ms 后重试...`);
      await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelay));
    }
  }

  return { success: false, message: `三次检测均失败` };
}

/**
 * 读取现有成员
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
 * 保存成员列表
 */
function saveMembers(members) {
  try {
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2) + "\n", "utf-8");
    console.log("✅ 已保存到 members.json");
    return true;
  } catch (error) {
    console.error("❌ 保存 members.json 失败:", error.message);
    return false;
  }
}

/**
 * 检查是否已存在
 */
function checkExists(members, website) {
  return members.some(
    (m) => m.website.toLowerCase() === website.toLowerCase()
  );
}

/**
 * 添加评论到议题
 */
async function addComment(body) {
  if (!GITHUB_TOKEN) {
    console.error("❌ 没有 GITHUB_TOKEN，无法添加评论");
    return false;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/comments`;

  return new Promise((resolve) => {
    const data = JSON.stringify({ body });

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "User-Agent": "GitHub Actions",
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ 评论添加成功");
            resolve(true);
          } else {
            console.error("❌ 添加评论失败:", responseData);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * 重新打开议题
 */
async function reopenIssue() {
  if (!GITHUB_TOKEN) {
    console.error("❌ 没有 GITHUB_TOKEN，无法重新打开议题");
    return false;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}`;

  return new Promise((resolve) => {
    const data = JSON.stringify({ state: "open" });

    const req = https.request(
      url,
      {
        method: "PATCH",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "User-Agent": "GitHub Actions",
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ 议题已重新打开");
            resolve(true);
          } else {
            console.error("❌ 重新打开议题失败:", responseData);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * 处理失败情况
 */
async function handleFailure(reason) {
  console.log("\n❌ 处理失败:", reason);

  const comment = `## ❌ 友链申请未通过

**原因：** ${reason}

请检查以下事项后重新提交：
1. 确保博客链接可以正常访问
2. 确保 RSS 订阅链接（如有）可以正常访问
3. 检查填写的信息是否完整正确

---
*此评论由自动化工作流生成*`;
n
  await addComment(comment);
  await reopenIssue();

  // 设置输出
  console.log("::set-output name=success::false");
  process.exit(0);
}

/**
 * 处理成功情况
 */
async function handleSuccess(memberData) {
  console.log("\n✅ 处理成功！");

  const comment = `## ✅ 友链申请已通过

您的博客已成功添加到友链列表！

**添加的信息：**
- 昵称：${memberData.name}
- 博客：${memberData.title}
- 链接：${memberData.website}

感谢您的申请！🎉

---
*此评论由自动化工作流生成*`;

  await addComment(comment);

  // 设置输出
  console.log("::set-output name=success::true");
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始处理友链申请...\n");
  console.log(`📋 议题编号: #${ISSUE_NUMBER}`);
  console.log(`📋 议题标题: ${ISSUE_TITLE}\n`);

  // 1. 解析议题内容
  console.log("📖 解析议题内容...");
  const data = parseIssueBody(ISSUE_BODY);
  console.log("解析结果:", JSON.stringify(data, null, 2));

  // 2. 验证数据
  console.log("\n🔍 验证数据...");
  const validation = validateData(data);
  if (!validation.valid) {
    await handleFailure(validation.error);
    return;
  }
  console.log("✅ 数据验证通过");

  // 3. 检测 website 可访问性
  console.log("\n🌐 检测博客链接...");
  const websiteCheck = await checkWithRetries(data.website, "博客链接");
  if (!websiteCheck.success) {
    await handleFailure(`博客链接无法访问：${websiteCheck.message}`);
    return;
  }

  // 4. 检测 feed 可访问性（如果有）
  if (data.feed && data.feed.trim() !== "") {
    console.log("\n📡 检测 RSS 订阅链接...");
    const feedCheck = await checkWithRetries(data.feed, "RSS 订阅链接");
    if (!feedCheck.success) {
      await handleFailure(`RSS 订阅链接无法访问：${feedCheck.message}`);
      return;
    }
  }

  // 5. 检查是否已存在
  console.log("\n📋 检查是否已存在...");
  const members = getMembers();
  if (checkExists(members, data.website)) {
    await handleFailure("该博客链接已存在于友链列表中");
    return;
  }
  console.log("✅ 检查通过，未重复");

  // 6. 构建新成员数据
  const newMember = {
    name: data.name,
    title: data.title,
    desc: data.desc,
    avatarType: data.avatarType,
    avatar: data.avatar,
    github: data.github || "",
    website: data.website,
    feed: data.feed || "",
  };

  // 7. 添加到成员列表
  console.log("\n💾 添加到成员列表...");
  members.push(newMember);

  if (!saveMembers(members)) {
    await handleFailure("保存数据失败，请稍后重试");
    return;
  }

  // 8. 处理成功
  await handleSuccess(newMember);

  console.log("\n🎉 处理完成！");
}

main().catch((error) => {
  console.error("\n💥 程序异常:", error);
  process.exit(1);
});
