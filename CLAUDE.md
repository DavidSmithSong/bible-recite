# CLAUDE.md — 背经计划 AI 握手与项目记忆

#ai-generated
#AI-generated

> 遵循 Song vault 中央 AI-Context 规范。

## 项目定位与事实
- **项目名**: `bible-recite`
- **GitHub**: `https://github.com/DavidSmithSong/bible-recite.git`
- **技术栈**: Next.js（纯静态页面 + API Routes + Supabase）
- **构建命令**: `npm install && npm run build`
- **当前版本**: `Discipleship0.13`

## 双机协作 & AI 握手
- **共享上下文**:
  - MacBook Air: `/Users/joker/Song/9 - Systems/AI-Context`
  - Mac Mini: `/Users/songhuafu/Obsidian-Git-Mirror/song-vault-backup/9 - Systems/AI-Context`
- 规则详情请参见中央 AI-Context。开工前检查 `git status` 与 `main...origin/main`，确认状态为 `0 0` 后获取写入权。

## 关键文件

```
app/bible/page.tsx          # 主页面：姓名登录门 + 本周/全部/统计三标签
app/bible/StudyCard.tsx     # 学习卡片：默写模式 + diff 高亮
app/bible/srs.ts            # SRS 算法（SM-2 变体）
app/bible/history.ts        # 答题历史（localStorage + saveHistory 导出供 cloud 使用）
app/bible/users.ts          # 用户标识、scopedKey、profileName 管理
app/bible/cloud.ts          # Supabase 云同步：createOrLoadProfile, hydrateFromCloud
app/bible/Heatmap.tsx       # 学习热力图
app/api/profile/route.ts    # API: 创建或加载用户档案
app/api/history/route.ts    # API: 追加答题记录
app/api/card-state/route.ts # API: 保存单个卡片状态
app/api/study-state/route.ts# API: 批量读写卡片状态+历史
lib/data/bible_verses.json  # 经文数据（id, lesson, reference, text, image?）
lib/data/paintings.ts       # 各课文艺复兴油画配图
lib/data/schedule.ts        # 门训排期（课次→日期）
lib/version.ts              # APP_VERSION 常量
lib/supabase-server.ts      # Supabase 服务端客户端
supabase/schema.sql         # 数据库表结构
```

## 已完成功能（截至 Discipleship0.13）

- **SRS 间隔重复**：SM-2 算法，按掌握程度自动安排复习日期
- **默写模式**：字符级 diff 高亮错误字
- **答题历史**：每次练习结果持久化，支持热力图展示
- **学习热力图**：按日期统计正确率
- **姓名登录门（NameGate）**：按姓名隔离数据，无密码
- **Supabase 云同步**：多设备数据同步，登录即自动迁移本地历史
- **本周经文标签**：根据门训排期自动定位当周课次
- **文艺复兴油画配图**：每课经文附对应画作封面
- **深色/浅色主题切换**

## 架构注意事项

- `saveHistory()` 必须保持为独立导出函数（`cloud.ts` 在 hydrate 时直接调用）
- 用户数据按 `scopedStorageKey` 隔离：`bible_history:{userId}`
- `migrationKey` 防止重复迁移旧版本数据
- 初始化流程：URL `?user=` 参数 → localStorage profileName → NameGate 输入
