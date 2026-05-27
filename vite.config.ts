import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        explore: resolve(__dirname, "explore.html"),
        shop: resolve(__dirname, "shop.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
})
