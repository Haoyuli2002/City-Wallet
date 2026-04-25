# 🏪 Merchant Dashboard — City Wallet

商户端管理界面，负责优惠规则设置、数据分析、扫码核销等。

## 负责人
前端队友B

## 技术栈
React / Next.js + TypeScript + Tailwind CSS + Recharts (图表)

## 需要实现的页面
1. **Dashboard** — KPI指标 + 漏斗图 + 收入影响 + 实时事件流
2. **Rules** — AI规则配置（折扣、目标、调性、预算、最大单数）
3. **Analytics** — 交易时段图 + 漏斗可视化 + 历史记录
4. **Scanner** — 摄像头扫QR码 → 核销确认 → 输入金额

## 需要调用的后端接口
- `GET /api/merchants` — 商户列表（登录选择）
- `GET /api/merchants/{id}` — 商户详情 + 当前规则
- `PUT /api/merchants/{id}/rules` — 更新AI规则
- `GET /api/merchants/{id}/analytics` — 漏斗 + 收入数据
- `GET /api/merchants/{id}/feed` — 实时事件流
- `POST /api/offers/{id}/redeem` — 扫码核销

## 原型参考
见 `prototypes/merchant_dashboard.html`（可直接在浏览器打开查看效果）

## 详细接口文档
见根目录 `API_DOCS.md`