export type AboutPathCard = {
  id: string
  title: string
  summary: string
  body: string
}

export const ABOUT_PATH_CARDS: AboutPathCard[] = [
  {
    id: "ritual",
    title: "Latest update & ritual",
    summary: "See when you last carbonated",
    body: "Our community shares quick rituals—morning fizz, post-workout chill, flavor swaps on Sundays. The habit sticks when it is visible.",
  },
  {
    id: "balance",
    title: "Balanced sparkle",
    summary: "Cold water, right fill line",
    body: "Neutral taste starts with cold water to the line. From there, flavor packs snap in without fighting the bubbles.",
  },
  {
    id: "temperature",
    title: "Temperature aware",
    summary: "Comfort in every sip",
    body: "Room-temp or iced—your bottle keeps the mouthfeel you picked. Real stories from commuters, parents, and gym regulars.",
  },
]

export const ABOUT_HERO_COPY = {
  tag: "What people say about us makes us proud",
  headline:
    "Discover how FIZZ5 transforms daily habits through the voices of our community—real experiences and honest sparkle.",
  sub: "Share your ritual. Tag #fizz5.",
}
