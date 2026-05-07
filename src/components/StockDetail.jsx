import { useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Icon } from "../lib/icons.jsx";
import { cn } from "../lib/utils.js";
import { Card, ChangeText, MetricCard } from "./Common.jsx";
import { TradingViewChart, TradingViewLink } from "./TradingView.jsx";

export default function StockDetail({ stock, prices, financials, factors, onBack }) {
  const [chartMode, setChartMode] = useState("internal");
  const selected = stock;
  const priceData = prices?.[selected.symbol] || [];
  const financialData = financials?.[selected.symbol] || [];
  const stockFactors = factors.filter((f) => f.symbol === selected.symbol);
  const metrics = [
    ["P/E", "manual"],
    ["P/BV", "manual"],
    ["Dividend Yield", "manual"],
    ["ROE", "manual"],
    ["D/E", "manual"],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
        <Icon name="arrowLeft" size={16} /> Back to Dashboard
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{selected.symbol}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{selected.sector}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{selected.name}</h1>
            <p className="mt-2 text-slate-600">{selected.industry} · Stock Detail with internal chart, TradingView, factors and notes.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Price</p><p className="mt-1 text-xl font-bold text-slate-950">{Number(selected.price || 0).toFixed(2)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Change</p><p className="mt-1 text-sm"><ChangeText value={selected.change} /></p></div>
            <div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-xs text-slate-300">Total Score</p><p className="mt-1 text-2xl font-bold">{selected.total}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon="building" label="Fundamental" value={selected.fundamental} sub="งบและคุณภาพกิจการ" />
        <MetricCard icon="barChart" label="Technical" value={selected.technical} sub="MA, RSI, Momentum" />
        <MetricCard icon="dollar" label="Valuation" value={selected.valuation} sub="P/E, P/BV, Yield" />
        <MetricCard icon="newspaper" label="Impact" value={selected.impact} sub="Catalyst & Risk" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-lg font-semibold text-slate-900">Price Chart</h2><p className="text-sm text-slate-500">เลือกดูกราฟภายในระบบ หรือ TradingView</p></div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <button onClick={() => setChartMode("internal")} className={cn("rounded-full px-3 py-1", chartMode === "internal" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}>Internal Chart</button>
              <button onClick={() => setChartMode("tradingview")} className={cn("rounded-full px-3 py-1", chartMode === "tradingview" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}>TradingView</button>
              <TradingViewLink symbol={selected.symbol} />
            </div>
          </div>
          {chartMode === "internal" ? (
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><ReLineChart data={priceData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="price" stroke="currentColor" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="ma20" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 5" dot={false} /><Line type="monotone" dataKey="ma50" stroke="currentColor" strokeWidth={1.5} strokeDasharray="2 4" dot={false} /></ReLineChart></ResponsiveContainer></div>
          ) : <TradingViewChart symbol={selected.symbol} />}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Valuation Snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">V1 เป็น placeholder สำหรับข้อมูล manual/CSV</p>
          <div className="mt-4 space-y-3">{metrics.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">{label}</span><span className="font-bold text-slate-950">{value}</span></div>)}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Financial Summary</h2>
          <p className="mt-1 text-sm text-slate-500">ตัวอย่างข้อมูลจาก public/data/financials.json</p>
          <div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={financialData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="revenue" radius={[8, 8, 0, 0]} /><Bar dataKey="profit" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Impact Factors</h2><p className="mt-1 text-sm text-slate-500">ปัจจัยบวก ลบ และสิ่งที่ต้องติดตาม</p></div><button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">Add Factor</button></div>
          <div className="mt-4 space-y-3">{stockFactors.map((item, index) => <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", item.type === "Positive" ? "bg-emerald-100 text-emerald-700" : item.type === "Negative" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>{item.type}</span><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">{item.level}</span></div><h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.detail}</p></div>)}</div>
        </Card>
      </div>
    </motion.div>
  );
}
