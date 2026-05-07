import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "public", "data");
const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));

const stocks = read("stocks.json");
const scores = read("scores.json");
const prices = read("prices.json");
const factors = read("factors.json");

function assert(condition, message) {
  if (!condition) {
    console.error(`Data validation failed: ${message}`);
    process.exit(1);
  }
}

assert(stocks.length === 30, "stocks.json should contain 30 stocks");
assert(new Set(stocks.map((s) => s.symbol)).size === stocks.length, "stock symbols should be unique");
assert(scores.length === stocks.length, "scores.json should contain one score row per stock");
for (const stock of stocks) {
  assert(stock.symbol && stock.name && stock.sector, `stock ${stock.symbol || "unknown"} is missing fields`);
  assert(prices[stock.symbol]?.length >= 6, `${stock.symbol} should have at least 6 price points`);
  assert(factors.some((f) => f.symbol === stock.symbol), `${stock.symbol} should have factors`);
}
console.log("Data validation passed");
