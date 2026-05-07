import { useEffect, useMemo, useState } from "react";
import { Icon } from "./lib/icons.jsx";
import { cn, mergeStockRows } from "./lib/utils.js";
import { loadAllData } from "./lib/dataLoader.js";
import Dashboard from "./components/Dashboard.jsx";
import StockDetail from "./components/StockDetail.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState("ADVANC");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllData().then(setData).catch((err) => setError(err.message));
  }, []);

  const rows = useMemo(() => data ? mergeStockRows(data.stocks, data.scores) : [], [data]);
  const selectedStock = rows.find((s) => s.symbol === selectedSymbol) || rows[0];

  const openStock = (stock) => {
    setSelectedSymbol(stock.symbol);
    setPage("stock");
  };

  if (error) {
    return <div className="min-h-screen bg-slate-100 p-8 text-rose-700">Error: {error}</div>;
  }

  if (!data || !selectedStock) {
    return <div className="min-h-screen bg-slate-100 p-8 text-slate-700">Loading stock dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <nav className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white"><Icon name="barChart" size={22} /></div>
            <div><p className="font-bold text-slate-950">Thai Stock Decision Helper</p><p className="text-xs text-slate-500">GitHub Pages · JSON Data · TradingView Link</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPage("dashboard")} className={cn("rounded-xl px-4 py-2 text-sm font-medium", page === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>Dashboard</button>
            <button onClick={() => setPage("stock")} className={cn("rounded-xl px-4 py-2 text-sm font-medium", page === "stock" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>Stock Detail</button>
            <button className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Factors</button>
            <button className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Settings</button>
          </div>
        </nav>
        {page === "dashboard" ? (
          <Dashboard rows={rows} prices={data.prices} factors={data.factors} onSelectStock={openStock} />
        ) : (
          <StockDetail stock={selectedStock} prices={data.prices} financials={data.financials} factors={data.factors} onBack={() => setPage("dashboard")} />
        )}
      </div>
    </div>
  );
}
