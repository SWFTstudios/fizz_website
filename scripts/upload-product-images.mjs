#!/usr/bin/env node
/**
 * Repo-root entrypoint — delegates to the theme upload script.
 *
 *   npm run shopify:upload-images
 *   STORE=g9rykd-jt.myshopify.com node scripts/upload-product-images.mjs
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeScript = join(__dirname, "..", "shopify-theme", "fizz-kinetic-spark", "scripts", "upload-product-images.mjs");

const result = spawnSync(process.execPath, [themeScript], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
