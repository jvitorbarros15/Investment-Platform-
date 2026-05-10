import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    base_currency: Mapped[str] = mapped_column(String, default="BRL")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    portfolios: Mapped[list["Portfolio"]] = relationship("Portfolio", back_populates="user")
    watchlist_items: Mapped[list["WatchlistItem"]] = relationship("WatchlistItem", back_populates="user")
    philosophy_profiles: Mapped[list["PhilosophyProfile"]] = relationship("PhilosophyProfile", back_populates="user")
    alert_rules: Mapped[list["AlertRule"]] = relationship("AlertRule", back_populates="user")
    alert_events: Mapped[list["AlertEvent"]] = relationship("AlertEvent", back_populates="user")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, default="My Portfolio")
    base_currency: Mapped[str] = mapped_column(String, default="BRL")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    holdings: Mapped[list["Holding"]] = relationship("Holding", back_populates="portfolio")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="portfolio")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    ticker: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    yahoo_symbol: Mapped[str] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    asset_class: Mapped[str] = mapped_column(String, nullable=False)  # BR_STOCK, US_STOCK, FII, CRYPTO, ETF, CASH
    market: Mapped[str] = mapped_column(String, nullable=True)
    exchange: Mapped[str] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="BRL")
    sector: Mapped[str] = mapped_column(String, nullable=True)
    industry: Mapped[str] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    holdings: Mapped[list["Holding"]] = relationship("Holding", back_populates="asset")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="asset")
    price_snapshots: Mapped[list["PriceSnapshot"]] = relationship("PriceSnapshot", back_populates="asset")
    scores: Mapped[list["AssetScore"]] = relationship("AssetScore", back_populates="asset")


class Holding(Base):
    __tablename__ = "holdings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    portfolio_id: Mapped[str] = mapped_column(String, ForeignKey("portfolios.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    average_cost: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String, default="BRL")
    current_price: Mapped[float] = mapped_column(Float, nullable=True)
    current_value: Mapped[float] = mapped_column(Float, nullable=True)
    total_invested: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_gain: Mapped[float] = mapped_column(Float, nullable=True)
    return_pct: Mapped[float] = mapped_column(Float, nullable=True)
    total_gain_including_dividends: Mapped[float] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="holdings")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="holdings")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    portfolio_id: Mapped[str] = mapped_column(String, ForeignKey("portfolios.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String, nullable=False)  # BUY, SELL, DIVIDEND, FEE
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    gross_amount: Mapped[float] = mapped_column(Float, default=0.0)
    fees: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String, default="BRL")
    exchange_rate: Mapped[float] = mapped_column(Float, default=1.0)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="transactions")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="transactions")


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    close_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="BRL")
    source: Mapped[str] = mapped_column(String, default="yfinance")

    asset: Mapped["Asset"] = relationship("Asset", back_populates="price_snapshots")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=True)
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    target_price: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="STUDYING")
    reason: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="watchlist_items")


class PhilosophyProfile(Base):
    __tablename__ = "philosophy_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, default="Default")
    quality_weight: Mapped[float] = mapped_column(Float, default=25.0)
    value_weight: Mapped[float] = mapped_column(Float, default=20.0)
    growth_weight: Mapped[float] = mapped_column(Float, default=15.0)
    dividend_weight: Mapped[float] = mapped_column(Float, default=10.0)
    financial_health_weight: Mapped[float] = mapped_column(Float, default=15.0)
    momentum_weight: Mapped[float] = mapped_column(Float, default=5.0)
    risk_weight: Mapped[float] = mapped_column(Float, default=5.0)
    portfolio_fit_weight: Mapped[float] = mapped_column(Float, default=5.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="philosophy_profiles")
    scores: Mapped[list["AssetScore"]] = relationship("AssetScore", back_populates="profile")


class AssetScore(Base):
    __tablename__ = "asset_scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=False)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("philosophy_profiles.id"), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, default=50.0)
    quality_score: Mapped[float] = mapped_column(Float, nullable=True)
    value_score: Mapped[float] = mapped_column(Float, nullable=True)
    growth_score: Mapped[float] = mapped_column(Float, nullable=True)
    dividend_score: Mapped[float] = mapped_column(Float, nullable=True)
    financial_health_score: Mapped[float] = mapped_column(Float, nullable=True)
    momentum_score: Mapped[float] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)
    explanation: Mapped[str] = mapped_column(String, nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="scores")
    profile: Mapped["PhilosophyProfile"] = relationship("PhilosophyProfile", back_populates="scores")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=True)
    ticker: Mapped[str] = mapped_column(String, nullable=True)
    alert_type: Mapped[str] = mapped_column(String, nullable=False)
    threshold_value: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="alert_rules")
    events: Mapped[list["AlertEvent"]] = relationship("AlertEvent", back_populates="alert_rule")


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    alert_rule_id: Mapped[str] = mapped_column(String, ForeignKey("alert_rules.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    ticker: Mapped[str] = mapped_column(String, nullable=True)
    message: Mapped[str] = mapped_column(String, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    alert_rule: Mapped["AlertRule"] = relationship("AlertRule", back_populates="events")
    user: Mapped["User"] = relationship("User", back_populates="alert_events")
