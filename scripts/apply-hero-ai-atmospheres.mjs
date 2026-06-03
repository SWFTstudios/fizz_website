/**
 * Blend optional AI atmosphere plates from assets/ into public hero atmosphere files.
 * Usage: npm run assets:hero-ai (after placing or generating hero-ai-atmosphere-*.png in assets/)
 */

import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const assetsDir = join(repoRoot, "assets")
const slidesPath = join(repoRoot, "src", "data", "hero-slides.json")
const outDir = join(repoRoot, "public", "images", "hero")
const WIDTH = 1920
const HEIGHT = 1080

const slides = JSON.parse(readFileSync(slidesPath, "utf8")).productSlides

for (const slide of slides) {
  const src = join(assetsDir, `hero-ai-atmosphere-${slide.slug}.png`)
  if (!existsSync(src)) {
    console.log(`Skip ${slide.slug} — no ${src}`)
    continue
  }

  const resized = await sharp(src)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .toBuffer()

  const baseName = `hero-atmosphere-${slide.slug}`
  await sharp(resized).webp({ quality: 86 }).toFile(join(outDir, `${baseName}.webp`))
  await sharp(resized).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, `${baseName}.jpg`))
  console.log(`Applied AI atmosphere → ${baseName}`)
}

console.log("Done")
