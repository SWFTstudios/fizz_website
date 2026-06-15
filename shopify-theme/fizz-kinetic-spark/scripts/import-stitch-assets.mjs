#!/usr/bin/env node
/**
 * Downloads Stitch-hosted images from code.html exports into assets/ (flat; stitch-{name}.jpg)
 * and writes assets/stitch-asset-map.json for reference.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeRoot = join(__dirname, "..");
const stitchRoot =
  process.env.STITCH_EXPORT_DIR ||
  join(
    process.env.HOME || "",
    "Downloads/stitch_fizz_premium_hydration_landing_page",
  );

const SOURCE_FILES = [
  "fizz_shop_dark_lifestyle_collection/code.html",
  "fizz_color_changing_sparkle_storefront/code.html",
  "fizz_aspirational_lifestyle_with_shop_the_look/code.html",
];

/** Semantic filenames keyed by URL substring (first unique match wins). */
const SEMANTIC_HINTS = [
  ["soccer-family", "AP1WRLsBhmwIqDTsrUJTHO"],
  ["bottle-coral-orange-studio", "AB6AXuDzehy9K6Hn4Wb6AF"],
  ["bottle-charcoal-black-studio", "AB6AXuAFZbjjrpdummuu3"],
  ["bottle-sage-green-studio", "AB6AXuA3lA2Eb1I56lw0z"],
  ["bottle-arctic-white-studio", "AB6AXuCyYcIRkIUP6lPrE"],
  ["hero-hiker-sunrise", "AB6AXuAT9YYRJ24v0JjFv9"],
  ["flavor-packs-lifestyle", "AB6AXuDAgKfCoRkpM1wuiG"],
  ["flavor-blood-orange", "AB6AXuB0wFwaFpB_a-WNGX"],
  ["flavor-zesty-lime", "AB6AXuCtPY4pi2OFnRC4H"],
  ["flavor-crisp-cucumber", "AB6AXuAnEa-1_3aXE141"],
  ["beach-arctic-white", "AB6AXuB_84hBx4WFtxx15"],
  ["hero-slideshow-1", "AB6AXuBCycJ4kBUDvxQMW6"],
  ["hero-slideshow-2", "AB6AXuBK_GkH9EBv1iaVG54"],
  ["hero-slideshow-3", "AB6AXuBA-wmk8lR28XL60U"],
  ["lifestyle-yoga", "AP1WRLvTiyQuqqVF3jf9j"],
  ["hotspot-sage-green", "AB6AXuDPHyIFARawrN4SS"],
  ["hotspot-arctic-white", "AB6AXuBAIgZBg8IdxMpO2"],
  ["lifestyle-hiking", "AP1WRLtWAbEjE4JaAFOYf"],
  ["hotspot-charcoal-black", "AB6AXuAufPUkWfF2dCqqC5"],
  ["lifestyle-beach", "AP1WRLulzqrM_a21Y5nX3"],
  ["macro-bubbles", "AP1WRLt6m1SRxjVe0FEa0"],
  ["shop-hero-pattern", "AP1WRLt6m1SRxjVe0FEa0"],
  ["bottle-arctic-white-pool", "AB6AXuBvZ3-vD9dRExJ2"],
  ["bottle-sage-green-kitchen", "AB6AXuDGyqm6xgf2jcG7c"],
  ["bottle-steel-navy-desk", "AB6AXuDSI0a3ZSm8w19fm"],
  ["bottle-coral-orange-pool", "AB6AXuABP7_xkTKNIAS7N"],
  ["bottle-electric-blue-water", "AB6AXuDJppZPGER6ogWyT"],
  ["bottle-charcoal-black-dinner", "AB6AXuCpd18KyZ8eX1HN"],
  ["flavor-orange-tangerine", "AB6AXuCXxIDTFCyGesm8p"],
  ["science-carbonation", "AB6AXuDLroV1wkywwq-j2"],
];

function semanticName(url) {
  for (const [name, hint] of SEMANTIC_HINTS) {
    if (url.includes(hint)) return name;
  }
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 10);
  return `stitch-${hash}`;
}

function extractUrls(html) {
  const pattern = /https:\/\/lh3\.googleusercontent\.com\/[^"'\s)]+/g;
  return [...html.matchAll(pattern)].map((m) => m[0]);
}

const outDir = join(themeRoot, "assets");
mkdirSync(outDir, { recursive: true });

const allUrls = new Set();
for (const rel of SOURCE_FILES) {
  const path = join(stitchRoot, rel);
  try {
    const html = readFileSync(path, "utf8");
    for (const url of extractUrls(html)) allUrls.add(url);
  } catch (err) {
    console.warn(`Skip missing source ${path}:`, err.message);
  }
}

const assetMap = {};
let index = 0;

for (const url of allUrls) {
  const base = semanticName(url);
  const filename = `stitch-${base}.jpg`;
  const dest = join(outDir, filename);

  if (!assetMap[url]) {
    console.log(`[${++index}/${allUrls.size}] ${filename}`);
    try {
      execSync(`curl -fsSL "${url}" -o "${dest}"`, { stdio: "inherit" });
      assetMap[url] = filename;
    } catch {
      console.error(`Failed: ${url}`);
    }
  }
}

const mapPath = join(themeRoot, "assets/stitch-asset-map.json");
writeFileSync(mapPath, JSON.stringify(assetMap, null, 2));
console.log(`\nWrote ${Object.keys(assetMap).length} assets → ${mapPath}`);
