import { getTradingViewUrl, getTradingViewWidgetUrl } from "../lib/utils.js";

export function TradingViewLink({ symbol }) {
  return (
    <a href={getTradingViewUrl(symbol)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
      Open in TradingView
    </a>
  );
}

export function TradingViewChart({ symbol }) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <iframe title={`TradingView Chart ${symbol}`} src={getTradingViewWidgetUrl(symbol)} className="h-full w-full" frameBorder="0" scrolling="no" allowFullScreen />
    </div>
  );
}
