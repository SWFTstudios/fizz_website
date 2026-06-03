export type FeatureSpotlightChapter = {
  id: string
  pillLabel: string
  title: string
  body: string
  calloutKicker: string
  calloutTitle: string
  calloutBody: string
}

export const FEATURE_SPOTLIGHT_CHAPTERS: FeatureSpotlightChapter[] = [
  {
    id: "carbonation",
    pillLabel: "Carbonation",
    title: "Crisp bubbles on demand—wherever you are.",
    body: "FIZZ5 pairs a slim 1L bottle with a portable carbonation maker so you can sparkle water in seconds, not trips to the store.",
    calloutKicker: "Crystal clear",
    calloutTitle: "Press. Buzz. Enjoy.",
    calloutBody: "Short bursts for light fizz, longer presses for bold sparkle—always with cold water to the fill line.",
  },
  {
    id: "flavor",
    pillLabel: "Flavor packs",
    title: "Flavor that snaps in without the sugar crash.",
    body: "Drop in our in-house flavor packs after you carbonate. The integrated infuser keeps fruit and herbs centered while you sip.",
    calloutKicker: "Mix & match",
    calloutTitle: "Seconds to flavor",
    calloutBody: "From citrus zest to berry blends—build a ritual that fits your day without syrupy aftertaste.",
  },
  {
    id: "portable",
    pillLabel: "Portable design",
    title: "A bottle built for bags, desks, and weekend trips.",
    body: "BPA-free Tritan™ stays clear and tough. The slim profile slides into cup holders and tote side pockets.",
    calloutKicker: "Travel ready",
    calloutTitle: "1L, still slim",
    calloutBody: "Full liter capacity with a clear fill line—hydration that keeps up with you, not the other way around.",
  },
  {
    id: "refill",
    pillLabel: "Quick refill",
    title: "Swap CO₂ and keep the ritual going.",
    body: "Compatible with FIZZ5 refills and makers. Rinse, carbonate, flavor—repeat without a complicated cleanup.",
    calloutKicker: "Low friction",
    calloutTitle: "Rinse. Fizz. Repeat.",
    calloutBody: "Top-rack safe bottle body and a quick lid rinse keep maintenance as light as your drink.",
  },
]
