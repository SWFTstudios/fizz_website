/**
 * Upload bottle GLTF to Cloudflare R2.
 *
 * Usage:
 *   node scripts/upload-bottle-gltf.mjs [path-to.gltf]
 *   R2_BUCKET=fizz-assets node scripts/upload-bottle-gltf.mjs
 *
 * Requires: wrangler CLI logged in, bucket configured.
 */

import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const defaultPath = resolve(
  process.env.HOME ?? "",
  "Downloads/fizz_bottle_scene_self_hosted/fizz_bottle_3d_file_export.gltf",
)
const filePath = resolve(process.argv[2] ?? defaultPath)
const bucket = process.env.R2_BUCKET ?? "fizz-assets"
const objectKey = process.env.R2_OBJECT_KEY ?? "models/fizz_bottle_3d_file_export.gltf"

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

console.log(`Uploading ${filePath} → r2://${bucket}/${objectKey}`)

const objectPath = `${bucket}/${objectKey}`

const result = spawnSync(
  "npx",
  [
    "wrangler",
    "r2",
    "object",
    "put",
    objectPath,
    `--file=${filePath}`,
    "--content-type=model/gltf+json",
    "--cache-control=public, max-age=31536000, immutable",
  ],
  { stdio: "inherit" },
)

if (result.status !== 0) {
  console.error(
    "\nUpload failed. Configure R2 bucket in Cloudflare dashboard and set R2_BUCKET.",
  )
  process.exit(result.status ?? 1)
}

const publicBase =
  process.env.R2_PUBLIC_BASE_URL ??
  "https://pub-a2774cc45c5e496ca8fb77d6772ba298.r2.dev"

console.log("\nSet in .env:")
console.log(`VITE_BOTTLE_GLTF_URL=${publicBase}/${objectKey}`)
