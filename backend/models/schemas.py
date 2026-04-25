"""
City Wallet — Pydantic 数据模型
所有API请求/响应的类型定义
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== 天气 ====================

class WeatherData(BaseModel):
    temp: float = Field(description="当前温度 °C")
    feels_like: float = Field(description="体感温度 °C")
    condition: str = Field(description="天气状况: Clear/Clouds/Rain/Snow")
    description: str = Field(description="详细描述")
    humidity: int = Field(description="湿度 %")
    wind_speed: float = Field(description="风速 m/s")
    icon: str = Field(description="天气emoji图标")
    trigger: str = Field(description="天气触发标签: cold/hot/rainy/nice")


# ==================== 时间 ====================

class TimeContext(BaseModel):
    current: str = Field(description="当前时间 ISO格式")
    slot: str = Field(description="时段: early_morning/morning/lunch_break/afternoon/evening/night")
    day_type: str = Field(description="weekday/weekend")
    label: str = Field(description="可读标签: Tuesday Lunch")


# ==================== 用户意图 ====================

class UserIntent(BaseModel):
    type: str = Field(default="browsing_general", description="意图类型")
    confidence: float = Field(default=0.5, description="置信度 0-1")
    movement: Optional[dict] = Field(default=None, description="移动摘要")


# ==================== 交易密度 ====================

class TransactionDensity(BaseModel):
    current_hour: int = Field(description="本小时交易数")
    avg_hour: int = Field(description="历史平均交易数")
    status: str = Field(description="very_low/low/normal/busy/very_busy")
    demand_gap: float = Field(description="需求缺口 0-1, 越高越冷清")


# ==================== 商户 ====================

class MerchantBasic(BaseModel):
    id: str
    place_id: Optional[str] = None
    name: str
    category: str
    address: Optional[str] = None
    lat: float
    lon: float
    rating: float = 0
    photo_url: Optional[str] = None
    distance_m: Optional[float] = None
    tx_density: Optional[TransactionDensity] = None


class MerchantRules(BaseModel):
    merchant_id: str
    max_discount_percent: int = Field(default=15, ge=5, le=50)
    target: str = Field(default="fill_quiet_hours")
    product_scope: List[str] = Field(default=["all"])
    brand_tone: str = Field(default="cozy")
    daily_budget_eur: float = Field(default=50.0)
    budget_spent_today: float = Field(default=0.0)
    active_hours_start: Optional[str] = None
    active_hours_end: Optional[str] = None
    is_active: bool = True


class MerchantRulesUpdate(BaseModel):
    max_discount_percent: Optional[int] = Field(default=None, ge=5, le=50)
    target: Optional[str] = None
    product_scope: Optional[List[str]] = None
    brand_tone: Optional[str] = None
    daily_budget_eur: Optional[float] = None
    active_hours_start: Optional[str] = None
    active_hours_end: Optional[str] = None
    is_active: Optional[bool] = None


# ==================== 上下文 ====================

class ContextRequest(BaseModel):
    lat: float = Field(description="用户纬度")
    lon: float = Field(description="用户经度")
    user_intent: str = Field(default="browsing_general", description="用户意图")
    confidence: float = Field(default=0.5, description="意图置信度")
    zone: str = Field(default="unknown", description="区域名称")


class ContextResponse(BaseModel):
    weather: WeatherData
    time: TimeContext
    user_intent: UserIntent
    nearby_merchants: List[MerchantBasic]
    events: List[dict] = Field(default=[])
    composite_trigger: str = Field(description="触发标签")
    trigger_score: float = Field(description="触发分数 0-1")


# ==================== Offer ====================

class OfferGenerateRequest(BaseModel):
    lat: float
    lon: float
    user_intent: str = "browsing_general"
    confidence: float = 0.5
    zone: str = "unknown"
    merchant_id: Optional[str] = Field(default=None, description="指定商户，或自动选择")
    user_id: str = Field(default="anonymous")


class OfferContent(BaseModel):
    headline: str = Field(description="情感化标题，最多6词")
    subtext: str = Field(description="一句话情境描述")
    discount_percent: int = Field(description="折扣百分比")
    original_item: Optional[str] = Field(default=None, description="推荐商品")
    cta_text: str = Field(default="Claim Now", description="按钮文本")
    mood: str = Field(default="cozy", description="情绪: cozy/warm/cool/energetic/fresh")
    color_primary: str = Field(default="#8B4513")
    color_background: str = Field(default="#FFF8DC")
    color_accent: str = Field(default="#D2691E")
    icon: str = Field(default="🎁")
    valid_minutes: int = Field(default=15)
    reasoning: str = Field(default="", description="AI推理说明")


class OfferResponse(BaseModel):
    id: str
    merchant: MerchantBasic
    content: OfferContent
    status: str = "generated"
    created_at: str
    expires_at: str
    qr_code: Optional[str] = Field(default=None, description="QR码base64，仅接受后有")
    token: Optional[str] = Field(default=None, description="核销token，仅接受后有")


# ==================== 核销 ====================

class RedeemRequest(BaseModel):
    token: str = Field(description="QR码中的token")
    transaction_amount: float = Field(description="实际消费金额")
    merchant_code: Optional[str] = Field(default=None, description="商户POS标识")


class RedeemResponse(BaseModel):
    status: str = Field(description="redeemed/invalid/expired")
    offer_id: Optional[str] = None
    discount_applied: Optional[float] = None
    cashback_credited: Optional[float] = None
    wallet_new_balance: Optional[float] = None
    message: str = ""


# ==================== 钱包 ====================

class WalletTransaction(BaseModel):
    id: int
    type: str
    amount: float
    description: str
    created_at: str


class WalletResponse(BaseModel):
    user_id: str
    balance: float
    transactions: List[WalletTransaction] = []


# ==================== 商户分析 ====================

class OfferFunnel(BaseModel):
    generated: int = 0
    displayed: int = 0
    accepted: int = 0
    redeemed: int = 0
    dismissed: int = 0
    expired: int = 0


class RevenueImpact(BaseModel):
    total_transaction_value: float = 0.0
    total_discount_given: float = 0.0
    estimated_incremental_revenue: float = 0.0
    cost_per_acquisition: float = 0.0
    roi_percent: float = 0.0


class MerchantAnalytics(BaseModel):
    merchant_id: str
    merchant_name: str
    period: str
    funnel: OfferFunnel
    rates: dict = Field(default={})
    revenue: RevenueImpact
    

class FeedEvent(BaseModel):
    timestamp: str
    event_type: str  # offer_generated/offer_accepted/offer_dismissed/offer_expired/offer_redeemed
    icon: str
    message: str
    details: Optional[dict] = None


class MerchantFeed(BaseModel):
    merchant_id: str
    events: List[FeedEvent] = []