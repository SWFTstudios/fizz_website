export type FeaturesChapter = {
  id: string
  timestamp: string
  label: string
  title: string
  body: string[]
  card: {
    heading: string
    leftLabel: string
    leftValue: string
    rightLabel: string
    rightValue: string
  }
}

export const FEATURES_CHAPTERS: FeaturesChapter[] = [
  {
    id: "latest",
    timestamp: "00.01",
    label: "Latest update",
    title: "Know when you last fizzed",
    body: [
      "Your bottle ritual stays visible at a glance—last carbonation time and date keep you consistent.",
      "Pair with flavor reminders so you never flat-line mid-week.",
    ],
    card: {
      heading: "Latest Update",
      leftLabel: "Last session",
      leftValue: "Today",
      rightLabel: "Next reminder",
      rightValue: "2h",
    },
  },
  {
    id: "ph",
    timestamp: "00.02",
    label: "pH level",
    title: "Balanced water, better taste",
    body: [
      "Neutral pH helps flavor packs dissolve evenly without harsh bite.",
      "Great baseline before you add citrus or berry blends.",
    ],
    card: {
      heading: "pH Level",
      leftLabel: "Reading",
      leftValue: "7.2",
      rightLabel: "Status",
      rightValue: "Normal",
    },
  },
  {
    id: "temperature",
    timestamp: "00.03",
    label: "Temperature",
    title: "Cold water, bolder bubbles",
    body: [
      "Chill to the fill line before you carbonate—CO₂ stays dissolved longer.",
      "Comfortable sipping temp after you flavor and go.",
    ],
    card: {
      heading: "Temperature",
      leftLabel: "Current",
      leftValue: "19°C",
      rightLabel: "After 30 min",
      rightValue: "42°C",
    },
  },
  {
    id: "purity",
    timestamp: "00.04",
    label: "Purity score",
    title: "Clear water in, clear ritual out",
    body: [
      "Start with filtered water for the cleanest sparkle and longest-lasting fizz.",
      "Rinse daily to keep taste neutral between flavor swaps.",
    ],
    card: {
      heading: "Purity",
      leftLabel: "Score",
      leftValue: "94",
      rightLabel: "Trend",
      rightValue: "Stable",
    },
  },
  {
    id: "tds",
    timestamp: "00.05",
    label: "TDS",
    title: "Minerals that support mouthfeel",
    body: [
      "Total dissolved solids affect how bubbles feel on your tongue.",
      "Dial in your source water once, then repeat the same crisp result.",
    ],
    card: {
      heading: "TDS",
      leftLabel: "Reading",
      leftValue: "120 ppm",
      rightLabel: "Target",
      rightValue: "80–150",
    },
  },
  {
    id: "filter",
    timestamp: "00.06",
    label: "Filter status",
    title: "Infuser stays centered",
    body: [
      "The integrated core keeps fruit and flavor packs in place while you carbonate.",
      "Swap filters on schedule for uninterrupted flow.",
    ],
    card: {
      heading: "Filter",
      leftLabel: "Life left",
      leftValue: "82%",
      rightLabel: "Replace",
      rightValue: "3 wks",
    },
  },
  {
    id: "reminder",
    timestamp: "00.07",
    label: "Reminder",
    title: "Hydration nudges that fit your day",
    body: [
      "Set gentle reminders between meetings or workouts.",
      "Syncs with your phone when you opt in—no noisy alerts.",
    ],
    card: {
      heading: "Reminder",
      leftLabel: "Next",
      leftValue: "14:00",
      rightLabel: "Streak",
      rightValue: "5 days",
    },
  },
  {
    id: "bluetooth",
    timestamp: "00.08",
    label: "Bluetooth",
    title: "Logs sync when you want them",
    body: [
      "Optional Bluetooth keeps your ritual history on your phone.",
      "Low-energy pairing—weeks of use on a single charge mindset.",
    ],
    card: {
      heading: "Bluetooth",
      leftLabel: "Status",
      leftValue: "Connected",
      rightLabel: "Battery",
      rightValue: "76%",
    },
  },
]
