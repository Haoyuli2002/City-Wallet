# 📱 Consumer App — City Wallet

消费者端界面，负责展示AI生成的offer卡片、QR码结算、钱包等。

## 负责人
前端队友A

## 技术栈
React / Next.js + TypeScript + Tailwind CSS

## 需要实现的页面
1. **Home** — 地图 + 上下文状态栏 + GenUI offer卡片
2. **Checkout** — QR码展示 + 倒计时 + 接受/拒绝
3. **Wallet** — 钱包余额 + 返现历史

## 需要调用的后端接口
- `POST /api/context` — 获取上下文
- `POST /api/offers/generate` — AI生成offer
- `POST /api/offers/{id}/accept` — 接受offer
- `POST /api/offers/{id}/dismiss` — 拒绝offer
- `GET /api/wallet/{user_id}` — 钱包余额

## 前端独立实现
- **intentEngine.ts** — 设备端GPS轨迹分析→意图推断（不发原始GPS给后端）
- **GenUI卡片渲染** — 根据后端返回的JSON动态渲染offer卡片

## 详细接口文档
见根目录 `API_DOCS.md`