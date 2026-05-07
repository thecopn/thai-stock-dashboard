import { getTradingViewUrl, getTradingViewWidgetUrl } from "../lib/utils.js";
import { Icon } from "../lib/icons.jsx";

export function TradingViewLink({ symbol, variant = "primary", label = "Open in TradingView", className = "" }) {
  const styles =
    variant === "compact"
      ? "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      : variant === "hero"
        ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        : "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800";

  return (
    <a href={getTradingViewUrl(symbol)} target="_blank" rel="noreferrer" className={`${styles} ${className}`}>
      <Icon name="externalLink" size={variant === "compact" ? 13 : 16} />
      {label}
    </a>
  );
}

export function TradingViewChart({ symbol }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">TradingView Chart · SET:{symbol}</p>
          <p className="text-xs text-slate-500">ใช้สำหรับดู indicator, drawing tools และกราฟเต็มจาก TradingView</p>
        </div>
        <TradingViewLink symbol={symbol} variant="compact" label="Open full chart" />
      </div>
      <iframe title={`TradingView Chart ${symbol}`} src={getTradingViewWidgetUrl(symbol)} className="h-[520px] w-full" frameBorder="0" scrolling="no" allowFullScreen />
    </div>
  );
}
