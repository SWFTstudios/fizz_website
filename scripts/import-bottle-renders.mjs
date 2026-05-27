/**
 * Import marketing bottle PNGs into public/images/bottles/.
 * Source: BottleRender_Marketing 2 (RGBA transparent exports).
 *
 * Usage: node scripts/import-bottle-renders.mjs [sourceDir]
 */

import { existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const defaultSource = join(
  process.env.HOME ?? "",
  "Downloads",
  "BottleRender_Marketing 2",
)
const sourceDir = resolve(process.argv[2] ?? defaultSource)
const outDir = join(repoRoot, "public", "images", "bottles")
const maxEdge = 1024

const MAPPING = [
  {
    dest: "bottle-orange.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_8.png",
  },
  {
    dest: "bottle-black.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_9.png",
  },
  {
    dest: "bottle-green.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_10.png",
  },
  {
    dest: "bottle-navy.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_11.png",
  },
  {
    dest: "bottle-white.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_12.png",
  },
  {
    dest: "bottle-blue.png",
    src: "FIzz_NZ_T3_Color_0519_2026.05.19_Render_Camera 6_7.png",
  },
  {
    dest: "lineup.png",
    src: "FIzz_NZ_T3_Color_0519_ColorLineUp_Camera 7_14.png",
  },
]

const py = `
import sys
from pathlib import Path
from PIL import Image

source_dir = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
max_edge = int(sys.argv[3])
mapping = ${JSON.stringify(MAPPING)}

out_dir.mkdir(parents=True, exist_ok=True)

def resize_keep_alpha(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    scale = min(1.0, max_edge / max(w, h))
    if scale < 1.0:
        nw, nh = int(w * scale), int(h * scale)
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    return im

for item in mapping:
    src = source_dir / item["src"]
    dest = out_dir / item["dest"]
    if not src.is_file():
        print(f"MISSING: {src}", file=sys.stderr)
        sys.exit(1)
    im = Image.open(src)
    im = resize_keep_alpha(im)
    im.save(dest, format="PNG", optimize=True, compress_level=9)
    corner = im.getpixel((0, 0))
    size_kb = dest.stat().st_size / 1024
    alpha = corner[3] if len(corner) == 4 else 255
    print(f"OK {item['dest']}: {im.size[0]}x{im.size[1]}, corner_alpha={alpha}, {size_kb:.0f} KB")
`

if (!existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

const result = spawnSync("python3", ["-c", py, sourceDir, outDir, String(maxEdge)], {
  stdio: "inherit",
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`\nWrote ${MAPPING.length} files to ${outDir}`)
