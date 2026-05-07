import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Icon } from "../lib/icons.jsx";
import { cn } from "../lib/utils.js";
import { Card, ChangeText, MetricCard, ScorePill } from "./Common.jsx";
import { TradingViewLink } from "./TradingView.jsx";

function formatDisplayDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function getLatestValue(items, field) {
  const values = items
    .map((item) => item?.[field])
    .filter(Boolean)
    .map(String)
    .sort();
  return values.length ? values[values.length - 1] : "-";
}

export default function Dashboard({ rows, prices, factors, onSelectStock }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => `${s.symbol} ${s.name} ${s.sector} ${s.industry}`.toLowerCase().includes(q));
  }, [rows, search]);

  const topStock = [...rows].sort((a, b) => (b.total || 0) - (a.total || 0))[0] || rows[0];
  const positiveCount = rows.filter((s) => (s.impact || 0) >= 70).length;
  const watchCount = rows.filter((s) => (s.total || 0) < 58).length;
  const avgScore = rows.length ? Math.round(rows.reduce((sum, s) => sum + (s.total || 0), 0) / rows.length) : 0;
  const marketData = prices?.[topStock?.symbol] || [];
  const latestPriceDate = getLatestValue(rows, "date");
  const latestUpdatedAt = getLatestValue(rows, "lastUpdatedAt");
  const latestSource = rows.find((row) => row.lastUpdatedAt === latestUpdatedAt)?.dataSource || "JSON / GitHub Actions";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            <Icon name="calendar" size={15} /> Price Date: {formatDisplayDate(latestPriceDate)} · Updated: {formatDisplayDate(latestUpdatedAt)}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Stock Watchlist Dashboard</h1>
          <p className="mt-2 text-slate-600">หุ้นไทย 30 ตัวจากกลุ่ม SET50 เริ่มต้น สำหรับคัดกรองก่อนตัดสินใจ พร้อมปุ่มเปิดกราฟ TradingView โดยตรง</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Icon name="download" size={16} /> Import CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            <Icon name="settings" size={16} /> Settings
          </button>
        </div>
      </div>

      <Card className="border-slate-300 bg-slate-900 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">Data freshness</p>
            <h2 className="mt-1 text-xl font-bold">Latest price data: {formatDisplayDate(latestPriceDate)}</h2>
            <p className="mt-1 text-sm text-slate-300">Last workflow update: {formatDisplayDate(latestUpdatedAt)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <p className="font-semibold">Source</p>
            <p className="text-slate-300">{latestSource}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon="lineChart" label="Universe" value={`${rows.length} stocks`} sub="Selected from SET50 constituents" />
        <MetricCard icon="sparkles" label="Top Score" value={topStock?.symbol || "-"} sub={`${topStock?.name || ""} · Score ${topStock?.total || "-"}`} />
        <MetricCard icon="trendingUp" label="High Impact" value={`${positiveCount} stocks`} sub="Impact score ≥ 70" />
        <MetricCard icon="shieldAlert" label="Watch / Risk" value={`${watchCount} stocks`} sub={`Average score ${avgScore}/100`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Market / Top Stock Trend</h2>
              <p className="text-sm text-slate-500">กราฟตัวอย่างจาก JSON data ของ {topStock?.symbol}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">Prototype Data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="price" stroke="currentColor" fill="currentColor" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Recent Impact Factors</h2>
          <p className="mt-1 text-sm text-slate-500">ปัจจัยล่าสุดจาก data/factors.json</p>
          <div className="mt-4 space-y-3">
            {factors.slice(0, 5).map((item, index) => (
              <div key={`${item.symbol}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", item.type === "Positive" ? "bg-emerald-100 text-emerald-700" : item.type === "Negative" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>{item.type}</span>
                  <span className="text-xs font-semibold text-slate-600">{item.symbol}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{item.title}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Watchlist 30 Stocks</h2>
            <p className="text-sm text-slate-500">คลิกชื่อหุ้นเพื่อดู Stock Detail</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Icon name="search" size={17} className="absolute left-3 top-2.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol, company, sector" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 md:w-72" />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Icon name="filter" size={16} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Symbol</th><th className="px-4 py-3">Sector</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3">Change</th><th className="px-4 py-3 text-center">Funda</th><th className="px-4 py-3 text-center">Tech</th><th className="px-4 py-3 text-center">Value</th><th className="px-4 py-3 text-center">Impact</th><th className="px-4 py-3 text-center">Total</th><th className="px-4 py-3">Key Positive</th><th className="px-4 py-3">Key Negative</th><th className="px-4 py-3 text-center">TradingView</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><button onClick={() => onSelectStock(s)} className="text-left"><div className="font-bold text-slate-950 hover:underline">{s.symbol}</div><div className="text-xs text-slate-500">{s.name}</div></button></td>
                  <td className="px-4 py-3 text-slate-600">{s.sector}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(s.price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><ChangeText value={s.change} /></td>
                  <td className="px-4 py-3 text-center"><ScorePill value={s.fundamental} /></td>
                  <td className="px-4 py-3 text-center"><ScorePill value={s.technical} /></td>
                  <td className="px-4 py-3 text-center"><ScorePill value={s.valuation} /></td>
                  <td className="px-4 py-3 text-center"><ScorePill value={s.impact} /></td>
                  <td className="px-4 py-3 text-center"><ScorePill value={s.total} /></td>
                  <td className="px-4 py-3 text-slate-700">{s.keyPositive}</td>
                  <td className="px-4 py-3 text-slate-700">{s.keyNegative}</td>
                  <td className="px-4 py-3 text-center"><TradingViewLink symbol={s.symbol} variant="compact" label="Open" /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => onSelectStock(s)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-slate-700 hover:bg-white hover:shadow-sm">Detail <Icon name="chevronRight" size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
