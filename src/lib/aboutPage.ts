import { ABOUT_HERO_COPY } from "../data/aboutCards"
import { destroyAboutPathScroll, initAboutPathScroll } from "./aboutPathScroll"

export function bootAboutPage(): void {
  document.body.classList.add("about-page")
  document.body.classList.remove("home-page", "z-scroll-page")
  document.title = "About | fizz5"

  const tag = document.querySelector<HTMLElement>("[data-about-tag]")
  const headline = document.querySelector<HTMLElement>("[data-about-headline]")
  const sub = document.querySelector<HTMLElement>("[data-about-sub]")
  if (tag) tag.textContent = ABOUT_HERO_COPY.tag
  if (headline) headline.textContent = ABOUT_HERO_COPY.headline
  if (sub) sub.textContent = ABOUT_HERO_COPY.sub

  initAboutPathScroll()
}

export function destroyAboutPage(): void {
  destroyAboutPathScroll()
}
