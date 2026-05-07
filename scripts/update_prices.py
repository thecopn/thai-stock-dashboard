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
- Some Thai tickers can have adjusted/split-like historical values from Yahoo history.
  This script compares the latest historical close with Yahoo quote price and corrects
  obvious mismatches before writing JSON.
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
PRICE_HISTORY_PERIOD = "2y"
PRICE_INTERVAL = "1d"
STALE_DAYS_LIMIT = 14
SCALE_MISMATCH_THRESHOLD = 0.15  # 15% mismatch between history close and quote price


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


def clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def calculate_technical_score(df: pd.DataFrame) -> int:
    """Technical score from trend, momentum and RSI.

    This is intentionally simple and explainable for V1:
    - Price above MA20/50/200 improves score
    - MA20 above MA50 improves score
    - 20d/60d momentum improves score
    - RSI in a healthy range improves score, overbought/weak RSI penalizes score
    """
    latest = df.iloc[-1]
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
        score += 14 if close >= ma200 else -14
    if ma20 is not None and ma50 is not None:
        score += 8 if ma20 >= ma50 else -6

    if len(df) >= 21 and close is not None:
        close_20 = clean_number(df.iloc[-21].get("Close"), None)
        if close_20:
            momentum20 = ((close - close_20) / close_20) * 100
            score += 8 if momentum20 >= 5 else 4 if momentum20 >= 1 else -6 if momentum20 <= -5 else 0

    if len(df) >= 61 and close is not None:
        close_60 = clean_number(df.iloc[-61].get("Close"), None)
        if close_60:
            momentum60 = ((close - close_60) / close_60) * 100
            score += 8 if momentum60 >= 8 else 4 if momentum60 >= 2 else -8 if momentum60 <= -8 else 0

    if rsi is not None:
        if 45 <= rsi <= 65:
            score += 8
        elif 35 <= rsi < 45 or 65 < rsi <= 75:
            score += 2
        elif rsi > 80:
            score -= 12
        elif rsi < 30:
            score -= 8

    return clamp_score(score)


def factor_weight(item: dict[str, Any]) -> int:
    level = str(item.get("level", "Medium")).lower()
    base = {"high": 18, "medium": 11, "low": 6}.get(level, 11)
    factor_type = str(item.get("type", "Watch")).lower()
    if factor_type == "positive":
        return base
    if factor_type == "negative":
        return -base
    # Watch means uncertainty/risk to monitor, so it is a smaller negative by default.
    return -max(3, round(base * 0.45))


def calculate_impact_score(symbol: str, factors_by_symbol: dict[str, list[dict[str, Any]]]) -> int:
    active = [
        item
        for item in factors_by_symbol.get(symbol, [])
        if str(item.get("status", "Active")).lower() == "active"
    ]
    if not active:
        return 50
    return clamp_score(50 + sum(factor_weight(item) for item in active))


def pick_factor_title(symbol: str, factors_by_symbol: dict[str, list[dict[str, Any]]], factor_type: str) -> str:
    items = [
        item for item in factors_by_symbol.get(symbol, [])
        if str(item.get("status", "Active")).lower() == "active" and item.get("type") == factor_type
    ]
    if not items:
        return "-"
    level_rank = {"High": 3, "Medium": 2, "Low": 1}
    items.sort(key=lambda item: level_rank.get(item.get("level"), 0), reverse=True)
    return str(items[0].get("title", "-"))


def build_score_reason(fundamental: int, technical: int, valuation: int, impact: int, total: int) -> str:
    return (
        f"Total score {total}/100 is calculated from Fundamental {fundamental} (35%), "
        f"Technical {technical} (30%), Valuation {valuation} (15%) and Impact {impact} (20%). "
        "Fundamental and valuation are manual V1 inputs; technical is calculated from price trend/RSI; "
        "impact is calculated from active factors in factors.json."
    )


def get_quote_price(ticker: yf.Ticker) -> float | None:
    """Get latest quote price from Yahoo metadata/fast_info.

    This is used to detect history data that is adjusted or stale for some .BK symbols.
    """
    candidates: list[Any] = []

    try:
        fast = ticker.fast_info
        for key in ("last_price", "regular_market_price", "previous_close", "regular_market_previous_close"):
            try:
                candidates.append(fast.get(key))
            except Exception:
                pass
    except Exception:
        pass

    try:
        info = ticker.get_info()
        for key in ("regularMarketPrice", "currentPrice", "previousClose", "regularMarketPreviousClose"):
            candidates.append(info.get(key))
    except Exception:
        pass

    for value in candidates:
        number = clean_number(value, None)
        if number is not None and number > 0:
            return number
    return None


def normalize_history_frame(df: pd.DataFrame, yahoo_symbol: str) -> pd.DataFrame:
    if df.empty:
        raise RuntimeError(f"No price data returned for {yahoo_symbol}")

    if isinstance(df.columns, pd.MultiIndex):
        # yfinance may return either (Price, Ticker) or (Ticker, Price). Keep the OHLCV level.
        level0 = set(str(x) for x in df.columns.get_level_values(0))
        level1 = set(str(x) for x in df.columns.get_level_values(1))
        ohlcv = {"Open", "High", "Low", "Close", "Volume"}
        if ohlcv.intersection(level0):
            df.columns = df.columns.get_level_values(0)
        elif ohlcv.intersection(level1):
            df.columns = df.columns.get_level_values(1)
        else:
            df.columns = df.columns.get_level_values(0)

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise RuntimeError(f"Missing columns for {yahoo_symbol}: {missing}")

    df = df[required].copy()
    df = df.dropna(subset=["Close"])
    df = df[df["Close"] > 0]
    df = df.sort_index()

    if df.empty:
        raise RuntimeError(f"No usable close prices for {yahoo_symbol}")

    return df


def get_stock_frame(symbol: str) -> pd.DataFrame:
    yahoo_symbol = f"{symbol}.BK"
    ticker = yf.Ticker(yahoo_symbol)

    df = ticker.history(
        period=PRICE_HISTORY_PERIOD,
        interval=PRICE_INTERVAL,
        auto_adjust=False,
        actions=False,
    )
    df = normalize_history_frame(df, yahoo_symbol)

    quote_price = get_quote_price(ticker)
    history_close = clean_number(df.iloc[-1].get("Close"), None)
    latest_date = pd.Timestamp(df.index[-1]).strftime("%Y-%m-%d")

    if history_close is None:
        raise RuntimeError(f"Latest close is missing for {yahoo_symbol}")

    if quote_price is not None:
        mismatch = abs((quote_price - history_close) / history_close)
        if mismatch >= SCALE_MISMATCH_THRESHOLD:
            ratio = quote_price / history_close
            print(
                f"{symbol}: WARNING history close {history_close:.2f} differs from quote {quote_price:.2f}. "
                f"Scaling OHLC by {ratio:.6f}.",
            )
            for col in ["Open", "High", "Low", "Close"]:
                df[col] = df[col] * ratio
        else:
            # Keep the latest displayed price aligned with Yahoo quote metadata.
            # This helps when Yahoo history is one delayed close behind the quote endpoint.
            df.loc[df.index[-1], "Close"] = quote_price
            df.loc[df.index[-1], "High"] = max(float(df.iloc[-1]["High"]), quote_price)
            df.loc[df.index[-1], "Low"] = min(float(df.iloc[-1]["Low"]), quote_price)

    latest_close_after_fix = clean_number(df.iloc[-1].get("Close"), None)
    print(
        f"{symbol}: latest history date={latest_date}, "
        f"history close={history_close:.2f}, "
        f"quote={quote_price if quote_price is not None else 'N/A'}, "
        f"saved close={latest_close_after_fix:.2f}"
    )

    latest_ts = pd.Timestamp(df.index[-1])
    if latest_ts.tzinfo is not None:
        today = pd.Timestamp.now(tz=latest_ts.tz).normalize()
    else:
        today = pd.Timestamp.now().normalize()
    days_old = (today - latest_ts.normalize()).days
    if days_old > STALE_DAYS_LIMIT:
        raise RuntimeError(f"Stale data for {yahoo_symbol}: latest date is {latest_date}")

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


def update_score(existing_score: dict[str, Any], df: pd.DataFrame, factors_by_symbol: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    latest = df.iloc[-1]
    previous_close = clean_number(df.iloc[-2].get("Close"), None) if len(df) >= 2 else None
    latest_close = clean_number(latest.get("Close"), None)
    symbol = str(existing_score.get("symbol", "")).upper()

    change = 0.0
    if previous_close and latest_close is not None:
        change = round(((latest_close - previous_close) / previous_close) * 100, 2)

    technical = calculate_technical_score(df)
    fundamental = int(existing_score.get("fundamental", 50))
    valuation = int(existing_score.get("valuation", 50))
    impact = calculate_impact_score(symbol, factors_by_symbol)
    total = round((fundamental * 0.35) + (technical * 0.30) + (valuation * 0.15) + (impact * 0.20))

    updated = dict(existing_score)
    updated.update(
        {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "price": latest_close,
            "change": change,
            "technical": technical,
            "impact": impact,
            "total": total,
            "scoreVersion": "v2-factor-impact",
            "scoreWeights": {
                "fundamental": 0.35,
                "technical": 0.30,
                "valuation": 0.15,
                "impact": 0.20,
            },
            "scoreReason": build_score_reason(fundamental, technical, valuation, impact, total),
            "keyPositive": pick_factor_title(symbol, factors_by_symbol, "Positive"),
            "keyNegative": pick_factor_title(symbol, factors_by_symbol, "Negative"),
            "dataSource": "yfinance",
            "yahooSymbol": f"{symbol}.BK",
            "lastUpdatedAt": datetime.now(timezone.utc).isoformat(),
        }
    )
    return updated


def main() -> int:
    stocks = read_json(DATA_DIR / "stocks.json", [])
    old_prices = read_json(DATA_DIR / "prices.json", {})
    old_scores = read_json(DATA_DIR / "scores.json", [])
    factors = read_json(DATA_DIR / "factors.json", [])
    factors_by_symbol: dict[str, list[dict[str, Any]]] = {}
    for item in factors:
        symbol = str(item.get("symbol", "")).strip().upper()
        if symbol:
            factors_by_symbol.setdefault(symbol, []).append(item)
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
            new_scores.append(update_score(existing_score, df, factors_by_symbol))
        except Exception as exc:  # Keep the dashboard usable if one symbol fails.
            print(f"WARNING: {symbol} failed: {exc}", file=sys.stderr)
            failures.append(symbol)
            if existing_score:
                failed_score = dict(existing_score)
                failed_score["dataSource"] = "previous-data"
                failed_score["lastUpdateError"] = str(exc)
                new_scores.append(failed_score)

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
