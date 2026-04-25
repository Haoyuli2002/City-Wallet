"""
City Wallet — 数据库初始化与管理
SQLite数据库，7张表，覆盖完整业务链路
"""

import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "city_wallet.db"))


async def get_db():
    """获取数据库连接"""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """初始化数据库：创建所有表"""
    db = await get_db()
    try:
        # 表1: merchants — 商户基本信息
        await db.execute("""
            CREATE TABLE IF NOT EXISTS merchants (
                id TEXT PRIMARY KEY,
                place_id TEXT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                address TEXT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                rating REAL DEFAULT 0,
                photo_url TEXT,
                phone TEXT,
                opening_hours TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 表2: merchant_rules — 商户AI规则
        await db.execute("""
            CREATE TABLE IF NOT EXISTS merchant_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merchant_id TEXT NOT NULL UNIQUE,
                max_discount_percent INTEGER DEFAULT 15,
                target TEXT DEFAULT 'fill_quiet_hours',
                product_scope TEXT DEFAULT '["all"]',
                brand_tone TEXT DEFAULT 'cozy',
                daily_budget_eur REAL DEFAULT 50.0,
                budget_spent_today REAL DEFAULT 0.0,
                active_hours_start TEXT,
                active_hours_end TEXT,
                is_active BOOLEAN DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)

        # 表3: simulated_transactions — 模拟Payone交易流
        await db.execute("""
            CREATE TABLE IF NOT EXISTS simulated_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merchant_id TEXT NOT NULL,
                amount REAL NOT NULL,
                timestamp DATETIME NOT NULL,
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)

        # 表4: offers — AI生成的Offer
        await db.execute("""
            CREATE TABLE IF NOT EXISTS offers (
                id TEXT PRIMARY KEY,
                merchant_id TEXT NOT NULL,
                user_id TEXT DEFAULT 'anonymous',
                headline TEXT NOT NULL,
                subtext TEXT,
                discount_percent INTEGER NOT NULL,
                original_item TEXT,
                cta_text TEXT DEFAULT 'Claim Now',
                mood TEXT DEFAULT 'cozy',
                color_primary TEXT DEFAULT '#8B4513',
                color_background TEXT DEFAULT '#FFF8DC',
                color_accent TEXT DEFAULT '#D2691E',
                icon TEXT DEFAULT '🎁',
                valid_minutes INTEGER DEFAULT 15,
                reasoning TEXT,
                context_snapshot TEXT,
                status TEXT DEFAULT 'generated',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                accepted_at DATETIME,
                redeemed_at DATETIME,
                dismissed_at DATETIME,
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)

        # 表5: redemptions — 核销记录
        await db.execute("""
            CREATE TABLE IF NOT EXISTS redemptions (
                id TEXT PRIMARY KEY,
                offer_id TEXT NOT NULL UNIQUE,
                merchant_id TEXT NOT NULL,
                user_id TEXT DEFAULT 'anonymous',
                token TEXT UNIQUE NOT NULL,
                transaction_amount REAL,
                discount_amount REAL,
                cashback_amount REAL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (offer_id) REFERENCES offers(id),
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)

        # 表6: wallet — 用户钱包
        await db.execute("""
            CREATE TABLE IF NOT EXISTS wallet (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                balance REAL DEFAULT 0.0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 表7: wallet_transactions — 钱包流水
        await db.execute("""
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                offer_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (offer_id) REFERENCES offers(id)
            )
        """)

        # 创建索引加速查询
        await db.execute("CREATE INDEX IF NOT EXISTS idx_offers_merchant ON offers(merchant_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_offers_user ON offers(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_redemptions_token ON redemptions(token)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_sim_tx_merchant ON simulated_transactions(merchant_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_sim_tx_time ON simulated_transactions(timestamp)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id)")

        await db.commit()
        print("✅ 数据库初始化完成：7张表已创建")
    finally:
        await db.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())