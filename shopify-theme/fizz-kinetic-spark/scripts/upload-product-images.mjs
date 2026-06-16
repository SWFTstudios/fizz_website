#!/usr/bin/env node
/**
 * Upload product images to Shopify via Admin GraphQL + staged uploads.
 *
 * Prereq:
 *   shopify store auth --store g9rykd-jt.myshopify.com --scopes read_products,write_products,write_files
 *
 * Usage (from repo root):
 *   npm run shopify:upload-images
 *   STORE=g9rykd-jt.myshopify.com node scripts/upload-product-images.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = process.env.STORE ?? "g9rykd-jt.myshopify.com";
const ASSETS = join(__dirname, "..", "assets");

const PRODUCTS = [
  {
    handle: "fizz-flavor-orange-tangerine",
    file: "flavor-pack-orange-tangerine.png",
    alt: "Fizz Orange Tangerine flavor pack",
  },
  {
    handle: "fizz-flavor-zesty-lime",
    file: "flavor-pack-zesty-lime.png",
    alt: "Fizz Zesty Lime flavor pack",
  },
  {
    handle: "fizz-flavor-mixed-berry",
    file: "flavor-pack-mixed-berry.png",
    alt: "Fizz Mixed Berry flavor pack",
  },
  {
    handle: "fizz-co2-refills",
    file: "fizz-co2-charge.png",
    alt: "Fizz Charge CO₂ refill canister",
  },
];

function shopifyExecute(query, variables = {}, allowMutations = false) {
  const args = [
    "store",
    "execute",
    "--store",
    STORE,
    "--query",
    query,
    "--variables",
    JSON.stringify(variables),
    "--json",
  ];
  if (allowMutations) args.push("--allow-mutations");

  const out = execFileSync("shopify", args, { encoding: "utf8" });
  const parsed = JSON.parse(out);
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }
  return parsed.data ?? parsed;
}

async function uploadFileToStagedTarget(target, filePath) {
  const form = new FormData();
  for (const param of target.parameters) {
    form.append(param.name, param.value);
  }
  const buffer = readFileSync(filePath);
  form.append("file", new Blob([buffer], { type: "image/png" }), basename(filePath));

  const res = await fetch(target.url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Staged upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function attachImage(productId, resourceUrl, alt) {
  const data = shopifyExecute(
    `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { id alt status }
        mediaUserErrors { field message }
      }
    }`,
    {
      productId,
      media: [{ originalSource: resourceUrl, alt, mediaContentType: "IMAGE" }],
    },
    true,
  );

  const errors = data.productCreateMedia?.mediaUserErrors ?? [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
}

async function main() {
  console.log(`Store: ${STORE}`);

  const productQuery = shopifyExecute(
    `query {
      orange: productByHandle(handle: "fizz-flavor-orange-tangerine") { id title }
      lime: productByHandle(handle: "fizz-flavor-zesty-lime") { id title }
      berry: productByHandle(handle: "fizz-flavor-mixed-berry") { id title }
      co2: productByHandle(handle: "fizz-co2-refills") { id title }
    }`,
  );

  const handleToId = {
    "fizz-flavor-orange-tangerine": productQuery.orange?.id,
    "fizz-flavor-zesty-lime": productQuery.lime?.id,
    "fizz-flavor-mixed-berry": productQuery.berry?.id,
    "fizz-co2-refills": productQuery.co2?.id,
  };

  for (const item of PRODUCTS) {
    const filePath = join(ASSETS, item.file);
    const productId = handleToId[item.handle];

    if (!productId) {
      console.warn(`✗ Skip ${item.handle} — product not found in Admin`);
      continue;
    }
    if (!existsSync(filePath)) {
      console.warn(`✗ Skip ${item.handle} — missing ${filePath}`);
      continue;
    }

    console.log(`→ ${item.handle} ← ${item.file}`);

    const staged = shopifyExecute(
      `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`,
      {
        input: [
          {
            resource: "PRODUCT_IMAGE",
            filename: item.file,
            mimeType: "image/png",
            httpMethod: "POST",
          },
        ],
      },
      true,
    );

    const errors = staged.stagedUploadsCreate?.userErrors ?? [];
    if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));

    const target = staged.stagedUploadsCreate.stagedTargets[0];
    await uploadFileToStagedTarget(target, filePath);
    await attachImage(productId, target.resourceUrl, item.alt);
    console.log(`  ✓ Uploaded`);
  }

  console.log("\nDone. Refresh Products in Admin to verify thumbnails.");
}

main().catch((err) => {
  if (String(err.message).includes("No stored app authentication")) {
    console.error("\nRun first:");
    console.error(
      "  shopify store auth --store g9rykd-jt.myshopify.com --scopes read_products,write_products,write_files",
    );
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
});
