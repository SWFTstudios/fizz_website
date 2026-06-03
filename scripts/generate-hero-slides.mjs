/**
 * Hero assets: atmosphere (no bottle) + full composite fallback.
 * Real bottle PNGs stay untouched in HTML; atmosphere is optional studio layer.
 * Usage: npm run assets:hero-slides
 */

import { mkdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const gradientsPath = join(repoRoot, "src", "data", "bottle-futuristic-gradients.json")
const slidesPath = join(repoRoot, "src", "data", "hero-slides.json")
const bottlesDir = join(repoRoot, "public", "images", "bottles")
const outDir = join(repoRoot, "public", "images", "hero")

const WIDTH = 1920
const HEIGHT = 1080
const BOTTLE_HEIGHT_RATIO = 0.65
const BOTTLE_BOTTOM_PAD = 40

const ACCENT_RIM_KEYS = new Set(["black", "navy", "blue"])

const gradients = JSON.parse(readFileSync(gradientsPath, "utf8"))
const slidesConfig = JSON.parse(readFileSync(slidesPath, "utf8"))

function futuristicGradientSvg(g, key) {
  const showAccent = ACCENT_RIM_KEYS.has(key)
  const angleRad = ((g.angle - 90) * Math.PI) / 180
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const len = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT)
  const x1 = cx - (Math.cos(angleRad) * len) / 2
  const y1 = cy - (Math.sin(angleRad) * len) / 2
  const x2 = cx + (Math.cos(angleRad) * len) / 2
  const y2 = cy + (Math.sin(angleRad) * len) / 2

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <linearGradient id="base" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
          <stop offset="0%" stop-color="${g.highlight}"/>
          <stop offset="42%" stop-color="${g.mid}"/>
          <stop offset="100%" stop-color="${g.deep}"/>
        </linearGradient>
        <radialGradient id="bloom" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stop-color="${g.glow}" stop-opacity="0.48"/>
          <stop offset="55%" stop-color="${g.glow}" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="${g.glow}" stop-opacity="0"/>
        </radialGradient>
        ${
          showAccent
            ? `<radialGradient id="accent" cx="68%" cy="32%" r="48%">
          <stop offset="0%" stop-color="${g.accent}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${g.accent}" stop-opacity="0"/>
        </radialGradient>`
            : ""
        }
        <radialGradient id="vignette" cx="50%" cy="50%" r="78%">
          <stop offset="50%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
        </radialGradient>
        <linearGradient id="mist" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.62"/>
          <stop offset="35%" stop-color="#ffffff" stop-opacity="0.22"/>
          <stop offset="58%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <filter id="noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.04"/>
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#base)"/>
      <rect width="100%" height="100%" fill="url(#bloom)"/>
      ${showAccent ? `<rect width="100%" height="100%" fill="url(#accent)"/>` : ""}
      <rect width="100%" height="100%" fill="url(#vignette)"/>
      <rect width="100%" height="55%" y="45%" fill="url(#mist)"/>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
    </svg>`,
  )
}

function shadowSvg(width, height, cx) {
  const rx = Math.round(width * 0.22)
  const ry = Math.round(height * 0.04)
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <ellipse cx="${cx}" cy="${height - 12}" rx="${rx}" ry="${ry}" fill="black" opacity="0.32"/>
    </svg>`,
  )
}

async function writeAtmosphere(slide) {
  const g = gradients[slide.gradientKey]
  const baseName = `hero-atmosphere-${slide.slug}`
  const background = await sharp(futuristicGradientSvg(g, slide.gradientKey)).png().toBuffer()

  await sharp(background).webp({ quality: 86 }).toFile(join(outDir, `${baseName}.webp`))
  await sharp(background).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, `${baseName}.jpg`))
  console.log(`Wrote ${baseName}.webp + .jpg`)
}

async function compositeFullSlide(slide) {
  const bottlePath = join(bottlesDir, slide.bottleFile)
  const baseName = `hero-slide-${slide.slug}`
  const g = gradients[slide.gradientKey]

  const background = await sharp(futuristicGradientSvg(g, slide.gradientKey)).png().toBuffer()

  const bottleMeta = await sharp(bottlePath).metadata()
  const targetHeight = Math.round(HEIGHT * BOTTLE_HEIGHT_RATIO)
  const scale = targetHeight / (bottleMeta.height ?? targetHeight)
  const targetWidth = Math.round((bottleMeta.width ?? targetHeight) * scale)

  const bottle = await sharp(bottlePath)
    .resize(targetWidth, targetHeight, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer()

  const bottleResized = await sharp(bottle).metadata()
  const bw = bottleResized.width ?? targetWidth
  const bh = bottleResized.height ?? targetHeight
  const left = Math.round((WIDTH - bw) / 2)
  const top = HEIGHT - bh - BOTTLE_BOTTOM_PAD

  const shadow = await sharp(shadowSvg(bw, bh, Math.round(bw / 2))).png().toBuffer()

  const composed = await sharp(background).composite([
    { input: shadow, left, top: top + bh - Math.round(bh * 0.12) },
    { input: bottle, left, top },
  ])

  await composed.clone().webp({ quality: 84 }).toFile(join(outDir, `${baseName}.webp`))
  await composed.clone().jpeg({ quality: 85, mozjpeg: true }).toFile(join(outDir, `${baseName}.jpg`))
  console.log(`Wrote ${baseName}.webp + .jpg (fallback composite)`)
}

mkdirSync(outDir, { recursive: true })

for (const slide of slidesConfig.productSlides) {
  await writeAtmosphere(slide)
  await compositeFullSlide(slide)
}

console.log(`Done — ${slidesConfig.productSlides.length} atmosphere + composite sets in ${outDir}`)
