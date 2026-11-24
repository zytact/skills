import { readFileSync } from "node:fs";

const PRIOR_RATING = 4.0;
const PRIOR_WEIGHT = 150;
const SPLIT_GAP = 3;

const [itemsFile, ...scoreFiles] = process.argv.slice(2);
if (!itemsFile || scoreFiles.length < 2) {
  console.error("usage: node rank.mjs items.json <rater>.json <rater>.json [...] > ranked.json");
  process.exit(1);
}

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
const spread = (values) => {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2))) || 1;
};
const correlation = (xs, ys) => {
  const mx = mean(xs);
  const my = mean(ys);
  const cov = mean(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  return cov / (spread(xs) * spread(ys));
};

const items = readJson(itemsFile);
const raters = scoreFiles.map((file) => ({
  name: file.replace(/^.*[\\/]/, "").replace(/\.json$/, ""),
  scores: new Map(readJson(file).map((row) => [String(row.id), row])),
}));

const missing = raters.flatMap((r) => items.filter((i) => !r.scores.has(String(i.id))).map((i) => `${r.name}:${i.id}`));
if (missing.length) {
  console.error(`missing scores: ${missing.join(", ")}`);
  process.exit(1);
}

const standardized = raters.map((r) => {
  const overalls = items.map((i) => r.scores.get(String(i.id)).overall);
  const m = mean(overalls);
  const s = spread(overalls);
  return new Map(items.map((i, k) => [String(i.id), (overalls[k] - m) / s]));
});

const reviewScore = (item) =>
  ((item.rating ?? 0) * item.ratingCount + PRIOR_RATING * PRIOR_WEIGHT) / (item.ratingCount + PRIOR_WEIGHT);

const ranked = items
  .map((item) => {
    const id = String(item.id);
    const overalls = raters.map((r) => r.scores.get(id).overall);
    return {
      ...item,
      raters: Object.fromEntries(raters.map((r) => [r.name, r.scores.get(id)])),
      avg: Number(mean(overalls).toFixed(1)),
      z: mean(standardized.map((s) => s.get(id))),
      split: Math.max(...overalls) - Math.min(...overalls) >= SPLIT_GAP,
      reviewScore: reviewScore(item),
    };
  })
  .sort((a, b) => b.z - a.z || b.avg - a.avg || b.reviewScore - a.reviewScore)
  .map((item, k) => ({ ...item, rank: k + 1 }));

const [first, second] = raters.map((r) => items.map((i) => r.scores.get(String(i.id)).overall));
const agreement = Number(correlation(first, second).toFixed(2));

console.error(`${ranked.length} items, agreement ${agreement}, splits ${ranked.filter((i) => i.split).length}`);
for (const item of ranked.slice(0, 10)) {
  console.error(`${String(item.rank).padStart(2)} ${item.avg} ${item.split ? "SPLIT " : ""}${item.brand} ${item.name} (${item.color}) ₹${item.price}`);
}
console.log(JSON.stringify({ agreement, items: ranked }, null, 1));
