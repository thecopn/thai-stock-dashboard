# Thai Stock Decision Helper

Static React dashboard for a 30-stock Thai SET watchlist. Built for GitHub Pages.

## Stack

- Vite + React
- Tailwind CSS v4
- Recharts
- Framer Motion
- Static JSON data in `public/data`
- GitHub Pages deploy workflow
- Placeholder GitHub Actions workflow for daily data update

## Initial Stock Universe

The starter list contains 30 stocks selected from SET50 H1 2026 constituents. It is a diversified watchlist for dashboard development, not a buy/sell recommendation.

## Run locally

```bash
npm install
npm run dev
```

## Validate and build

```bash
npm run test:data
npm run build
npm run preview
```

## GitHub Pages setup

1. Create a GitHub repository named `thai-stock-dashboard`.
2. Push this project to the `main` branch.
3. Go to Settings → Pages.
4. Set Source to GitHub Actions.
5. The deploy workflow will publish `dist` to GitHub Pages.

If your repository name is different, edit `vite.config.js`:

```js
base: "/your-repo-name/"
```

## Data files

- `public/data/stocks.json` — stock master
- `public/data/scores.json` — score and latest price rows
- `public/data/prices.json` — chart data by symbol
- `public/data/financials.json` — mock financial data by symbol
- `public/data/factors.json` — positive/negative/watch factors

## Next implementation steps

1. Replace mock prices with yfinance data in `scripts/update_prices.py`.
2. Calculate MA/RSI/technical score.
3. Add CSV import for financial data.
4. Add real factor editing flow later using GitHub API, Supabase, or Firebase.


## Daily real price update at 06:00 Thailand time

The workflow `.github/workflows/update-stock-data.yml` runs at 06:00 Asia/Bangkok on Thai business mornings using this UTC cron:

```yaml
cron: "0 23 * * 0-4"
```

That equals 23:00 UTC Sunday-Thursday, which is 06:00 Monday-Friday in Thailand.

The workflow runs:

```bash
python scripts/update_prices.py
```

The script downloads daily Thai stock prices from Yahoo Finance via `yfinance` using symbols like `AOT.BK`, then updates:

```text
public/data/prices.json
public/data/scores.json
```

If one ticker fails, the script keeps the previous data for that ticker so the dashboard still works.

> Note: GitHub scheduled workflows can be delayed. The schedule should be treated as "around 06:00" rather than guaranteed exact delivery.

## v5 updates

- TradingView links are more visible on the Dashboard table and Stock Detail header.
- Score logic updated to `v2-factor-impact`:
  - Fundamental 35% (manual V1 input)
  - Technical 30% (auto: MA20/50/200, RSI14, 20d/60d momentum)
  - Valuation 15% (manual V1 input)
  - Impact 20% (auto from active Positive/Negative/Watch factors in `factors.json`)
- `factors.json` now contains Positive, Negative and Watch factors for all 30 stocks.

This dashboard is for personal research only and is not investment advice.
