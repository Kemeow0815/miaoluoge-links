import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../docs/.vitepress/data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");
const LOG_FILE = path.join(__dirname, "../../check-website-log.json");

// 检测配置
const CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  requestTimeout: 10000,
};

// 日志记录
const logs = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalChecked: 0,
  successful: [],
  failed: [],
  removed: [],
  errors: [],
};

function saveLog() {
  logs.endTime = new Date().toISOString();
  const logData = {
    ...logs,
    summary: {
      total: logs.totalChecked,
      success: logs.successful.length,
      failed: logs.failed.length,
      removed: logs.removed.length,
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

function checkWebsite(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, { timeout: CONFIG.requestTimeout }, (res) => {
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

async function checkWithRetries(member) {
  const name = member.name;
  const website = member.website;
  console.log("\n🔍 开始检测: " + name + " - " + website);

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    console.log("  尝试 " + attempt + "/" + CONFIG.maxRetries + "...");

    const result = await checkWebsite(website);

    if (result.success) {
      console.log("  ✅ 成功 (" + result.statusCode + ")");
      return {
        success: true,
        member,
        attempts: attempt,
        lastStatus: result.statusCode,
      };
    }

    console.log("  ❌ 失败: " + result.message);

    if (attempt < CONFIG.maxRetries) {
      console.log("  ⏳ 等待 " + CONFIG.retryDelay + "ms 后重试...");
      await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelay));
    }
  }

  return {
    success: false,
    member,
    attempts: CONFIG.maxRetries,
    message: "All retries failed",
  };
}

function getMembers() {
  try {
    const data = fs.readFileSync(MEMBERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ 读取 members.json 失败:", error.message);
    process.exit(1);
  }
}

function saveMembers(members) {
  try {
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2) + "\n", "utf-8");
    console.log("\n💾 已更新 members.json");
  } catch (error) {
    console.error("❌ 保存 members.json 失败:", error.message);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 开始网站通达性检测...\n");
  console.log("⏰ 开始时间: " + logs.startTime);
  console.log("🔧 配置: 最大重试" + CONFIG.maxRetries + "次, 超时" + CONFIG.requestTimeout + "ms\n");

  const members = getMembers();
  console.log("📋 共有 " + members.length + " 个成员需要检测\n");

  const toRemove = [];
  const toKeep = [];

  for (const member of members) {
    logs.totalChecked++;

    if (!member.website) {
      console.log("⚠️ " + member.name + ": 没有网站链接，跳过");
      toKeep.push(member);
      continue;
    }

    const result = await checkWithRetries(member);

    if (result.success) {
      logs.successful.push({
        name: member.name,
        website: member.website,
        attempts: result.attempts,
        statusCode: result.lastStatus,
      });
      toKeep.push(member);
    } else {
      logs.failed.push({
        name: member.name,
        website: member.website,
        attempts: result.attempts,
        message: result.message,
      });
      toRemove.push(member);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 检测结果汇总");
  console.log("=".repeat(60));
  console.log("✅ 正常: " + logs.successful.length + " 个");
  console.log("❌ 失效: " + logs.failed.length + " 个");

  if (toRemove.length > 0) {
    console.log("\n🗑️  以下成员将被移除:");
    for (const m of toRemove) {
      console.log("   - " + m.name + ": " + m.website);
      logs.removed.push({
        name: m.name,
        website: m.website,
        removedAt: new Date().toISOString(),
      });
    }
    saveMembers(toKeep);
  } else {
    console.log("\n✨ 所有网站均正常，无需移除");
  }

  console.log("=".repeat(60));

  saveLog();

  console.log("\n✅ 检测完成!");
  console.log("   总计: " + logs.totalChecked);
  console.log("   正常: " + logs.successful.length);
  console.log("   失效: " + logs.failed.length);
  console.log("   移除: " + logs.removed.length);
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
