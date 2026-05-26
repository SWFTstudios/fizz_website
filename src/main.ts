import "./styles/global.css";

// Entry point for the fizz5 static frontend served by Cloudflare.
document.documentElement.classList.add("js");

// Basic navigation behavior for anchor links.
document.addEventListener("click", (e) => {
  const target = e.target as Element | null;
  const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
  if (!link) return;

  const hash = link.getAttribute("href");
  if (!hash) return;

  const el = document.querySelector(hash);
  if (!el) return;

  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
});

