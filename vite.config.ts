import { defineConfig } from "vite"
import { resolve } from "path"

const productSlugs = [
  "coral-orange",
  "charcoal-black",
  "sage-green",
  "steel-navy",
  "arctic-white",
  "electric-blue",
] as const

const productInputs = Object.fromEntries(
  productSlugs.map((slug) => [
    `product-${slug}`,
    resolve(__dirname, `products/${slug}.html`),
  ]),
)

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        explore: resolve(__dirname, "explore.html"),
        shop: resolve(__dirname, "shop.html"),
        bottles: resolve(__dirname, "bottles.html"),
        flavors: resolve(__dirname, "flavors.html"),
        co2: resolve(__dirname, "co2.html"),
        ...productInputs,
      },
    },
  },
  server: {
    port: 5173,
  },
})
