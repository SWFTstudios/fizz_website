import { destroyFeaturesTimeline, initFeaturesTimeline } from "./featuresTimeline"

export function bootFeaturesPage(): void {
  document.body.classList.add("features-page")
  document.body.classList.remove("home-page", "z-scroll-page")
  document.title = "Features | fizz5"
  initFeaturesTimeline()
}

export function destroyFeaturesPage(): void {
  destroyFeaturesTimeline()
}
