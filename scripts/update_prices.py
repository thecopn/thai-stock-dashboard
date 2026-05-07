"""Fetch real Thai stock prices and update static JSON files.

Runs in GitHub Actions and writes:
- public/data/prices.json
- public/data/scores.json

Data source:
- yfinance / Yahoo Finance public data
- Thai stock tickers use the Yahoo suffix `.BK`, for example AOT.BK

Notes:
- This is for a personal research dashboard, not real-time trading.
- If a ticker fails to download, the script keeps existing JSON data for that ticker.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
import yfinance as yf

DATA_DIR = Path(__file__).resolve().parents[1] / "public" / "data"
PRICE_HISTORY_PERIOD = "18mo"
PRICE_INTERVAL = "1d"


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def clean_number(value: Any, digits: int | None = 2) -> float | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
        number = float(value)
        if math.isnan(number) or math.isinf(number):
            return None
        return round(number, digits) if digits is not None else number
    except (TypeError, ValueError):
        return None


def calculate_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, pd.NA)
    return 100 - (100 / (1 + rs))


def calculate_technical_score(latest: pd.Series) -> int:
    score = 50
    close = clean_number(latest.get("Close"), None)
    ma20 = clean_number(latest.get("MA20"), None)
    ma50 = clean_number(latest.get("MA50"), None)
    ma200 = clean_number(latest.get("MA200"), None)
    rsi = clean_number(latest.get("RSI14"), None)

    if close is not None and ma20 is not None:
        score += 10 if close >= ma20 else -8
    if close is not None and ma50 is not None:
        score += 12 if close >= ma50 else -10
    if close is not None and ma200 is not None:
        score += 12 if close >= ma200 else -12
    if ma20 is not None and ma50 is not None:
        score += 8 if ma20 >= ma50 else -6

    if rsi is not None:
        if 45 <= rsi <= 65:
            score += 8
        elif 35 <= rsi < 45 or 65 < rsi <= 75:
            score += 2
        elif rsi > 80:
            score -= 10
        elif rsi < 30:
            score -= 6

    return max(0, min(100, round(score)))


def get_stock_frame(symbol: str) -> pd.DataFrame:
    yahoo_symbol = f"{symbol}.BK"
    df = yf.download(
        yahoo_symbol,
        period=PRICE_HISTORY_PERIOD,
        interval=PRICE_INTERVAL,
        auto_adjust=False,
        progress=False,
        threads=False,
    )

    if df.empty:
        raise RuntimeError(f"No price data returned for {yahoo_symbol}")

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise RuntimeError(f"Missing columns for {yahoo_symbol}: {missing}")

    df = df[required].dropna(subset=["Close"])
    if df.empty:
        raise RuntimeError(f"No usable close prices for {yahoo_symbol}")

    df["MA20"] = df["Close"].rolling(20, min_periods=1).mean()
    df["MA50"] = df["Close"].rolling(50, min_periods=1).mean()
    df["MA200"] = df["Close"].rolling(200, min_periods=1).mean()
    df["RSI14"] = calculate_rsi(df["Close"])
    return df.tail(260)


def frame_to_price_rows(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for idx, row in df.iterrows():
        rows.append(
            {
                "date": idx.strftime("%Y-%m-%d"),
                "open": clean_number(row.get("Open")),
                "high": clean_number(row.get("High")),
                "low": clean_number(row.get("Low")),
                "close": clean_number(row.get("Close")),
                "price": clean_number(row.get("Close")),
                "ma20": clean_number(row.get("MA20")),
                "ma50": clean_number(row.get("MA50")),
                "ma200": clean_number(row.get("MA200")),
                "rsi14": clean_number(row.get("RSI14")),
                "volume": clean_number(row.get("Volume"), 0),
            }
        )
    return rows


def update_score(existing_score: dict[str, Any], df: pd.DataFrame) -> dict[str, Any]:
    latest = df.iloc[-1]
    previous_close = clean_number(df.iloc[-2].get("Close"), None) if len(df) >= 2 else None
    latest_close = clean_number(latest.get("Close"), None)

    change = 0.0
    if previous_close and latest_close is not None:
        change = round(((latest_close - previous_close) / previous_close) * 100, 2)

    technical = calculate_technical_score(latest)
    fundamental = int(existing_score.get("fundamental", 50))
    valuation = int(existing_score.get("valuation", 50))
    impact = int(existing_score.get("impact", 50))
    total = round((fundamental * 0.40) + (technical * 0.25) + (valuation * 0.20) + (impact * 0.15))

    updated = dict(existing_score)
    updated.update(
        {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "price": latest_close,
            "change": change,
            "technical": technical,
            "total": total,
            "lastUpdatedAt": datetime.now(timezone.utc).isoformat(),
        }
    )
    return updated


def main() -> int:
    stocks = read_json(DATA_DIR / "stocks.json", [])
    old_prices = read_json(DATA_DIR / "prices.json", {})
    old_scores = read_json(DATA_DIR / "scores.json", [])
    old_score_by_symbol = {item.get("symbol"): item for item in old_scores if item.get("symbol")}

    new_prices: dict[str, list[dict[str, Any]]] = dict(old_prices)
    new_scores: list[dict[str, Any]] = []
    failures: list[str] = []

    for stock in stocks:
        symbol = stock["symbol"].strip().upper()
        existing_score = old_score_by_symbol.get(symbol, {"symbol": symbol})
        try:
            print(f"Fetching {symbol}.BK ...")
            df = get_stock_frame(symbol)
            new_prices[symbol] = frame_to_price_rows(df)
            new_scores.append(update_score(existing_score, df))
        except Exception as exc:  # Keep the dashboard usable if one symbol fails.
            print(f"WARNING: {symbol} failed: {exc}", file=sys.stderr)
            failures.append(symbol)
            if existing_score:
                new_scores.append(existing_score)

    # Preserve score order based on stocks.json.
    new_score_by_symbol = {item.get("symbol"): item for item in new_scores if item.get("symbol")}
    ordered_scores = [new_score_by_symbol[s["symbol"]] for s in stocks if s["symbol"] in new_score_by_symbol]

    write_json(DATA_DIR / "prices.json", new_prices)
    write_json(DATA_DIR / "scores.json", ordered_scores)

    print(f"Updated prices for {len(stocks) - len(failures)}/{len(stocks)} symbols.")
    if failures:
        print(f"Symbols using previous data: {', '.join(failures)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
