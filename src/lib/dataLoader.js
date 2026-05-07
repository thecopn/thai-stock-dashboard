const base = import.meta.env.BASE_URL || "/";

async function loadJson(path) {
  const response = await fetch(`${base}data/${path}`);
  if (!response.ok) throw new Error(`Cannot load ${path}: ${response.status}`);
  return response.json();
}

export async function loadAllData() {
  const [stocks, prices, financials, factors, scores] = await Promise.all([
    loadJson("stocks.json"),
    loadJson("prices.json"),
    loadJson("financials.json"),
    loadJson("factors.json"),
    loadJson("scores.json"),
  ]);

  return { stocks, prices, financials, factors, scores };
}
