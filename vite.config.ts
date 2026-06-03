import { copyFileSync, createReadStream, existsSync } from "node:fs"
import { homedir } from "node:os"
import { resolve } from "node:path"
import { defineConfig, type Plugin } from "vite"

const LOCAL_BOTTLE_GLTF_PATH = resolve(
  process.env.FIZZ_BOTTLE_GLTF_DEV_PATH ??
    resolve(homedir(), "Downloads/fizz_bottle_3d_file_export.gltf"),
)

const LOCAL_BOTTLE_GLTF_URL = "/local-dev/fizz_bottle_3d_file_export.gltf"

const LOCAL_OCEAN_GLTF_PATH = resolve(
  process.env.FIZZ_OCEAN_GLTF_DEV_PATH ??
    resolve(homedir(), "Downloads/ocean_scene_self_hosted/ocean.gltf"),
)

const LOCAL_OCEAN_GLTF_URL = "/local-dev/ocean.gltf"

const LOCAL_DEV_GLTFS: Record<string, string> = {
  [LOCAL_BOTTLE_GLTF_URL]: LOCAL_BOTTLE_GLTF_PATH,
  [LOCAL_OCEAN_GLTF_URL]: LOCAL_OCEAN_GLTF_PATH,
}

/** Branch homepage: `/` → 3d.html in dev; copy 3d build to dist/index.html on build. */
function b3dBranchHomepage(): Plugin {
  return {
    name: "b3d-branch-homepage",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split("?")[0]
        if (path === "/" || path === "/index.html") {
          req.url = "/3d.html"
        }
        next()
      })
    },
    closeBundle() {
      const distDir = resolve(__dirname, "dist")
      const marketingHome = resolve(distDir, "index.html")
      const legacyHome = resolve(distDir, "legacy-home.html")
      const b3dHome = resolve(distDir, "3d.html")
      if (existsSync(marketingHome)) {
        copyFileSync(marketingHome, legacyHome)
      }
      if (existsSync(b3dHome)) {
        copyFileSync(b3dHome, marketingHome)
      }
    },
  }
}

/** Dev-only: serve large GLTFs from Downloads without copying into public/. */
function serveLocalDevGltfs(): Plugin {
  return {
    name: "serve-local-dev-gltfs",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0]
        if (!path || !(path in LOCAL_DEV_GLTFS)) {
          next()
          return
        }
        const filePath = LOCAL_DEV_GLTFS[path]
        if (!existsSync(filePath)) {
          res.statusCode = 404
          res.end(`Missing file: ${filePath}`)
          return
        }
        res.setHeader("Content-Type", "model/gltf+json")
        res.setHeader("Cache-Control", "no-store")
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

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
  plugins: [b3dBranchHomepage(), serveLocalDevGltfs()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "3d.html"),
        "legacy-home": resolve(__dirname, "index.html"),
        features: resolve(__dirname, "features.html"),
        about: resolve(__dirname, "about.html"),
        explore: resolve(__dirname, "explore.html"),
        shop: resolve(__dirname, "shop.html"),
        bottles: resolve(__dirname, "bottles.html"),
        flavors: resolve(__dirname, "flavors.html"),
        co2: resolve(__dirname, "co2.html"),
        ...productInputs,
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three"
          if (id.includes("node_modules/gsap")) return "gsap"
          if (id.includes("node_modules/lottie-web")) return "lottie"
          if (id.includes("node_modules/@barba")) return "barba"
          if (id.includes("node_modules/@splidejs")) return "splide"
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
