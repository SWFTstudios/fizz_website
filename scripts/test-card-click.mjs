import { chromium } from "playwright"

const BASE = process.env.BASE_URL || "http://localhost:5173"
const url = `${BASE}/explore.html?debugClicks=1`

let browser
try {
  browser = await chromium.launch({ headless: true })
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("Executable doesn't exist")) {
    console.error(
      "Playwright Chromium is not installed. Run:\n\n  npx playwright install chromium\n\nThen retry:\n\n  npm run test:card-click\n",
    )
    process.exit(1)
  }
  throw err
}
const page = await browser.newPage()

const logs = []
page.on("console", (msg) => {
  const text = msg.text()
  if (text.includes("[click-debug]")) {
    logs.push(text)
  }
})

console.log("Opening", url)
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })

await page.waitForSelector("#zs-loader.is-done", { timeout: 15000 }).catch(() => {
  console.log("Loader may still be visible; continuing…")
})

await page.waitForSelector(".zs-card", { timeout: 10000 })
console.log("Cards in DOM:", await page.locator(".zs-card").count())

async function scrollUntilFocused() {
  for (let step = 0; step < 50; step++) {
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(150)
    const state = await page.evaluate(() => ({
      focused: !!document.querySelector(".zs-card--focused"),
      titleVisible: document.getElementById("zs-fact-title")?.classList.contains("visible"),
    }))
    if (state.focused && state.titleVisible) {
      console.log("Focused card + title at scroll step", step)
      return true
    }
  }
  return false
}

async function clickFocusedCard() {
  const box = await page.evaluate(() => {
    const card = document.querySelector(".zs-card--focused")
    if (!card) return null
    const rect = card.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  })
  if (!box) return false
  await page.mouse.click(box.x, box.y)
  return true
}

async function waitForFocusTitleReady() {
  await page.waitForFunction(
    () => {
      const title = document.getElementById("zs-fact-title")
      const focused = document.querySelector(".zs-card--focused")
      if (!title?.classList.contains("visible") || !focused) return false
      return getComputedStyle(title).pointerEvents === "auto"
    },
    { timeout: 10000 },
  )
}

if (!(await scrollUntilFocused())) {
  console.error("No focused card + title after scrolling")
  await browser.close()
  process.exit(1)
}

console.log("Test 1: dispatch click on focused card")
if (!(await clickFocusedCard())) {
  console.error("Could not click focused card")
  await browser.close()
  process.exit(1)
}

await page.waitForTimeout(1200)

let expanded = await page.locator(".zs-card--expanded").count()
console.log("After card click:", { expanded })

if (expanded === 0) {
  console.error("Focused card click did not expand")
  logs.slice(-10).forEach((l) => console.log(" ", l))
  await browser.close()
  process.exit(1)
}

await page.keyboard.press("Escape")
await page.waitForTimeout(1000)

expanded = await page.locator(".zs-card--expanded").count()
if (expanded > 0) {
  console.error("Card did not collapse after Escape")
  await browser.close()
  process.exit(1)
}

await waitForFocusTitleReady()

console.log("Test 2: clicking #zs-fact-title")
await page.evaluate(() => {
  document.getElementById("zs-fact-title")?.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
  )
})
await page.waitForTimeout(1200)

expanded = await page.locator(".zs-card--expanded").count()
const overlayActive = await page.locator("#zs-card-overlay.is-active").count()
console.log("After title click:", { expanded, overlayActive })

logs.slice(-12).forEach((l) => console.log(" ", l))

await browser.close()
process.exit(expanded > 0 ? 0 : 1)
