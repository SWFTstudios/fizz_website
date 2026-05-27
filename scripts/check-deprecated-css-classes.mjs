#!/usr/bin/env node
/**
 * Fails CI if removed CTA class names are reintroduced in src/ or HTML.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/** Exact deprecated classes (not layout wrappers like zs-card-detail-cta-wrap). */
const DEPRECATED = [
  { name: "card-cta", pattern: /\bcard-cta\b/ },
  { name: "product-pdp__cta", pattern: /\bproduct-pdp__cta\b/ },
  { name: "zs-end-cta", pattern: /\bzs-end-cta\b/ },
  { name: "zs-card-detail-cta", pattern: /\bzs-card-detail-cta\b(?!-)/ },
]
const ROOT = new URL("..", import.meta.url).pathname

const scanDirs = ["src", "products", "index.html", "explore.html", "bottles.html", "shop.html"]

function collectFiles(path) {
  const full = join(ROOT, path)
  try {
    const st = statSync(full)
    if (st.isFile()) return [full]
  } catch {
    return []
  }
  const out = []
  for (const name of readdirSync(full)) {
    const child = join(full, name)
    const childStat = statSync(child)
    if (childStat.isDirectory()) out.push(...collectFiles(join(path, name)))
    else if (/\.(css|html|ts)$/.test(name)) out.push(child)
  }
  return out
}

const files = scanDirs.flatMap((p) => collectFiles(p))
let failed = false

for (const file of files) {
  const text = readFileSync(file, "utf8")
  for (const { name, pattern } of DEPRECATED) {
    if (pattern.test(text)) {
      console.error(`${file}: deprecated class "${name}" found`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log("No deprecated CTA classes found.")
