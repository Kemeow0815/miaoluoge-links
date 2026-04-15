import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../docs/.vitepress/data');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
const LISTS_FILE = path.join(DATA_DIR, 'lists.json');

/**
 * 根据 avatarType 获取完整的头像 URL
 * 对应 member.ts 中的 getAvatarUrl 函数逻辑
 */
function getAvatarUrl(member) {
    const { avatarType: type, avatar } = member;

    if (type === 'github') {
        return `https://avatars-githubusercontent.webp.se/${avatar}?s=96`;
    }
    if (type === 'qq') {
        return `https://q1.qlogo.cn/g?b=qq&nk=${avatar}&s=4`;
    }
    if (type === 'url') {
        return avatar;
    }
    return '';
}

/**
 * 主函数：同步 members 到 lists
 */
function syncMembers() {
    try {
        // 读取 members.json
        const membersData = fs.readFileSync(MEMBERS_FILE, 'utf-8');
        const members = JSON.parse(membersData);

        // 读取现有的 lists.json
        let lists = { friends: [] };
        if (fs.existsSync(LISTS_FILE)) {
            const listsData = fs.readFileSync(LISTS_FILE, 'utf-8');
            lists = JSON.parse(listsData);
        }

        // 转换 members 为 friends 格式 [name, website, avatar]
        const newFriends = members.map(member => {
            const name = member.name;
            const website = member.website;
            const avatar = getAvatarUrl(member);
            return [name, website, avatar];
        });

        // 追加到 lists.friends 下方（去重）
        const existingUrls = new Set(lists.friends.map(f => f[1]));
        const uniqueNewFriends = newFriends.filter(f => !existingUrls.has(f[1]));

        lists.friends = [...lists.friends, ...uniqueNewFriends];

        // 写回 lists.json
        fs.writeFileSync(LISTS_FILE, JSON.stringify(lists, null, 2) + '\n', 'utf-8');

        console.log(`✅ 同步完成！`);
        console.log(`   - 原有友链: ${existingUrls.size} 个`);
        console.log(`   - 新增友链: ${uniqueNewFriends.length} 个`);
        console.log(`   - 总计友链: ${lists.friends.length} 个`);

        return true;
    } catch (error) {
        console.error('❌ 同步失败:', error.message);
        process.exit(1);
    }
}

// 执行同步
syncMembers();
