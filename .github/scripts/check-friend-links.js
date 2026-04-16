import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const BACKUP_DIR = path.join(__dirname, "../../backups");
const LOG_FILE = path.join(__dirname, "../../check-friend-links-log.json");

// 从环境变量获取 GitHub 信息
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// 检测配置
const CONFIG = {
  maxRetries: 3,
  retryDelay: 30000, // 30秒
  requestTimeout: 15000,
};

// 日志记录
const logs = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalChecked: 0,
  successful: [],
  failed: [],
  removed: [],
  issuesReopened: [],
  errors: [],
};

/**
 * 保存日志
 */
function saveLog() {
  logs.endTime = new Date().toISOString();
  const logData = {
    ...logs,
    summary: {
      total: logs.totalChecked,
      success: logs.successful.length,
      failed: logs.failed.length,
      removed: logs.removed.length,
      issuesReopened: logs.issuesReopened.length,
    },
  };

  try {
    let existingLogs = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, "utf-8");
      existingLogs = JSON.parse(content);
    }

    existingLogs.unshift(logData);
    if (existingLogs.length > 50) {
      existingLogs = existingLogs.slice(0, 50);
    }

    fs.writeFileSync(LOG_FILE, JSON.stringify(existingLogs, null, 2) + "\n", "utf-8");
    console.log("\n📝 日志已保存到 " + LOG_FILE);
  } catch (error) {
    console.error("❌ 保存日志失败:", error.message);
  }
}

/**
 * 创建备份
 */
function createBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(BACKUP_DIR, `members-${timestamp}.json`);

    fs.copyFileSync(MEMBERS_FILE, backupFile);
    console.log("✅ 备份已创建: " + backupFile);
    return backupFile;
  } catch (error) {
    console.error("❌ 创建备份失败:", error.message);
    return null;
  }
}

/**
 * 检测网站是否可访问
 */
function checkWebsite(url) {
  return new Promise((resolve) => {
    if (!url || url.trim() === "") {
      resolve({ success: true, skipped: true, message: "No URL provided" });
      return;
    }

    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, { timeout: CONFIG.requestTimeout }, (res) => {
      // 2xx 和 3xx (重定向) 都视为成功
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        success,
        statusCode: res.statusCode,
        message: success ? "OK" : "HTTP " + res.statusCode,
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
async function checkWithRetries(url, name, type) {
  console.log(`🔍 检测${type}: ${name} - ${url}`);

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    console.log(`  尝试 ${attempt}/${CONFIG.maxRetries}...`);

    const result = await checkWebsite(url);

    if (result.success || result.skipped) {
      if (result.skipped) {
        console.log(`  ⏭️ 跳过 (无${type})`);
      } else {
        console.log(`  ✅ 成功 (${result.statusCode})`);
      }
      return { success: true, skipped: result.skipped, attempts: attempt };
    }

    console.log(`  ❌ 失败: ${result.message}`);

    if (attempt < CONFIG.maxRetries) {
      console.log(`  ⏳ 等待 ${CONFIG.retryDelay / 1000}秒后重试...`);
      await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelay));
    }
  }

  return { success: false, message: `三次检测均失败` };
}

/**
 * 读取成员列表
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
    console.log("✅ 已更新 members.json");
    return true;
  } catch (error) {
    console.error("❌ 保存 members.json 失败:", error.message);
    return false;
  }
}

/**
 * 验证 JSON 格式
 */
function validateJSON() {
  try {
    const data = fs.readFileSync(MEMBERS_FILE, "utf-8");
    JSON.parse(data);
    console.log("✅ JSON 格式验证通过");
    return true;
  } catch (error) {
    console.error("❌ JSON 格式验证失败:", error.message);
    return false;
  }
}

/**
 * 查找相关议题
 */
async function findRelatedIssue(memberName, website) {
  if (!GITHUB_TOKEN) {
    console.error("❌ 没有 GITHUB_TOKEN，无法查找议题");
    return null;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=closed&labels=友链申请&per_page=100`;

  return new Promise((resolve) => {
    const options = {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Actions",
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const issues = JSON.parse(responseData);
            // 查找包含该网站链接的议题
            const relatedIssue = issues.find((issue) => {
              const body = issue.body || "";
              return body.includes(website) || body.includes(memberName);
            });
            resolve(relatedIssue ? relatedIssue.number : null);
          } catch (error) {
            console.error("❌ 解析议题列表失败:", error.message);
            resolve(null);
          }
        } else {
          console.error("❌ 查找议题失败 (状态码:", res.statusCode + ")");
          resolve(null);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      resolve(null);
    });

    req.end();
  });
}

/**
 * 重新打开议题
 */
async function reopenIssue(issueNumber) {
  if (!GITHUB_TOKEN) {
    console.error("❌ 没有 GITHUB_TOKEN，无法重新打开议题");
    return false;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`;

  return new Promise((resolve) => {
    const postData = JSON.stringify({ state: "open" });

    const options = {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Actions",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ 议题 #${issueNumber} 已重新打开`);
          resolve(true);
        } else {
          console.error(`❌ 重新打开议题 #${issueNumber} 失败 (状态码:`, res.statusCode + ")");
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 添加评论到议题
 */
async function addComment(issueNumber, body) {
  if (!GITHUB_TOKEN) {
    console.error("❌ 没有 GITHUB_TOKEN，无法添加评论");
    return false;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`;

  return new Promise((resolve) => {
    const postData = JSON.stringify({ body: body });

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitHub-Actions",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ 评论已添加到议题 #${issueNumber}`);
          resolve(true);
        } else {
          console.error(`❌ 添加评论到议题 #${issueNumber} 失败 (状态码:`, res.statusCode + ")");
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 处理移除的友链 - 重新打开相关议题
 */
async function handleRemovedMember(member, failReason) {
  console.log(`\n📋 查找相关议题: ${member.name}`);

  const issueNumber = await findRelatedIssue(member.name, member.website);

  if (issueNumber) {
    console.log(`✅ 找到相关议题 #${issueNumber}`);

    // 重新打开议题
    const reopened = await reopenIssue(issueNumber);

    if (reopened) {
      // 添加评论
      const comment = `## ⚠️ 友链检测失败

您的友链已被自动检测系统移除，原因如下：

**失败原因：** ${failReason}

**被移除的友链信息：**
- 昵称：${member.name}
- 博客：${member.title}
- 链接：${member.website}
- RSS：${member.feed || "无"}

**如何重新申请：**
1. 请确保您的网站可以正常访问
2. 确保 RSS 订阅链接（如有）可以正常访问
3. 修复问题后，可以重新提交友链申请

---
*此评论由自动化检测工作流生成*`;

      await addComment(issueNumber, comment);

      logs.issuesReopened.push({
        name: member.name,
        website: member.website,
        issueNumber,
        failReason,
      });
    }
  } else {
    console.log("ℹ️ 未找到相关议题");
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始友链通达性检测...\n");
  console.log(`⏰ 开始时间: ${logs.startTime}`);
  console.log(`🔧 配置: 最大重试${CONFIG.maxRetries}次, 间隔${CONFIG.retryDelay / 1000}秒\n`);

  // 1. 创建备份
  console.log("💾 创建备份...");
  const backupFile = createBackup();
  if (!backupFile) {
    console.error("❌ 备份失败，中止操作");
    process.exit(1);
  }

  // 2. 读取成员列表
  const members = getMembers();
  console.log(`📋 共有 ${members.length} 个友链需要检测\n`);

  const toRemove = [];
  const toKeep = [];

  // 3. 逐个检测
  for (const member of members) {
    logs.totalChecked++;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📌 检测友链: ${member.name}`);
    console.log(`${"=".repeat(60)}`);

    let failReason = "";

    // 检测 website
    console.log("\n🌐 检测博客链接...");
    const websiteCheck = await checkWithRetries(member.website, member.name, "博客链接");

    if (!websiteCheck.success) {
      failReason = `博客链接无法访问：${websiteCheck.message}`;
      console.log(`❌ ${failReason}`);
    }

    // 检测 feed（如果有）
    let feedCheck = { success: true, skipped: true };
    if (!failReason && member.feed && member.feed.trim() !== "") {
      console.log("\n📡 检测 RSS 订阅链接...");
      feedCheck = await checkWithRetries(member.feed, member.name, "RSS 订阅链接");

      if (!feedCheck.success) {
        failReason = `RSS 订阅链接无法访问：${feedCheck.message}`;
        console.log(`❌ ${failReason}`);
      }
    }

    // 判断是否保留
    if (failReason) {
      console.log(`\n🗑️ 标记移除: ${member.name}`);
      logs.failed.push({
        name: member.name,
        website: member.website,
        feed: member.feed,
        reason: failReason,
      });
      toRemove.push({ member, failReason });
    } else {
      console.log(`\n✅ 保留: ${member.name}`);
      logs.successful.push({
        name: member.name,
        website: member.website,
        feed: member.feed,
        websiteAttempts: websiteCheck.attempts,
        feedAttempts: feedCheck.skipped ? 0 : feedCheck.attempts,
      });
      toKeep.push(member);
    }
  }

  // 4. 执行移除
  console.log("\n" + "=".repeat(60));
  console.log("📊 检测结果汇总");
  console.log("=".repeat(60));
  console.log(`✅ 正常: ${logs.successful.length} 个`);
  console.log(`❌ 失效: ${logs.failed.length} 个`);

  if (toRemove.length > 0) {
    console.log("\n🗑️  移除以下友链:");
    for (const { member, failReason } of toRemove) {
      console.log(`   - ${member.name}: ${failReason}`);
      logs.removed.push({
        name: member.name,
        website: member.website,
        feed: member.feed,
        reason: failReason,
        removedAt: new Date().toISOString(),
      });

      // 处理相关议题
      await handleRemovedMember(member, failReason);
    }

    // 保存更新后的成员列表
    console.log("\n💾 保存更新后的成员列表...");
    if (!saveMembers(toKeep)) {
      console.error("❌ 保存失败，尝试恢复备份...");
      fs.copyFileSync(backupFile, MEMBERS_FILE);
      console.log("✅ 已恢复备份");
    }

    // 验证 JSON 格式
    console.log("\n🔍 验证 JSON 格式...");
    if (!validateJSON()) {
      console.error("❌ 验证失败，尝试恢复备份...");
      fs.copyFileSync(backupFile, MEMBERS_FILE);
      console.log("✅ 已恢复备份");
    }
  } else {
    console.log("\n✨ 所有友链均正常，无需移除");
  }

  console.log("=".repeat(60));

  // 5. 保存日志
  saveLog();

  console.log("\n✅ 检测完成!");
  console.log(`   总计: ${logs.totalChecked}`);
  console.log(`   正常: ${logs.successful.length}`);
  console.log(`   失效: ${logs.failed.length}`);
  console.log(`   移除: ${logs.removed.length}`);
  console.log(`   议题 reopened: ${logs.issuesReopened.length}`);
}

main()
  .then(() => {
    console.log("\n🎉 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 程序异常:", error);
    logs.errors.push({
      time: new Date().toISOString(),
      error: error.message,
    });
    saveLog();
      process.exit(1);
  });
