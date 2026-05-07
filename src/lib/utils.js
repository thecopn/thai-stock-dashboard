export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function mergeStockRows(stocks, scores) {
  const scoreBySymbol = Object.fromEntries(scores.map((s) => [s.symbol, s]));
  return stocks.map((stock) => ({ ...stock, ...(scoreBySymbol[stock.symbol] || {}) }));
}

export function getTradingViewUrl(symbol) {
  return `https://www.tradingview.com/symbols/SET-${symbol}/`;
}

export function getTradingViewWidgetUrl(symbol) {
  const params = new URLSearchParams({
    symbol: `SET:${symbol}`,
    interval: "D",
    theme: "light",
    style: "1",
    timezone: "Asia/Bangkok",
    withdateranges: "1",
    hide_side_toolbar: "0",
    allow_symbol_change: "1",
    save_image: "1",
    locale: "th_TH",
  });
  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
}
