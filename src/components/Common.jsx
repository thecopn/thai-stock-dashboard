import { Icon } from "../lib/icons.jsx";
import { cn } from "../lib/utils.js";

export function Card({ children, className = "" }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

export function ScorePill({ value }) {
  const tone = value >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : value >= 55 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200";
  return <span className={cn("inline-flex min-w-12 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>{value ?? "-"}</span>;
}

export function ChangeText({ value = 0 }) {
  const positive = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", positive ? "text-emerald-600" : "text-rose-600")}>
      <Icon name={positive ? "trendingUp" : "trendingDown"} size={14} />
      {positive ? "+" : ""}{Number(value).toFixed(2)}%
    </span>
  );
}

export function MetricCard({ icon, label, value, sub }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon name={icon} size={22} />
        </div>
      </div>
    </Card>
  );
}
