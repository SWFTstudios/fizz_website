/*
 * fizz-scrub-video.js
 * Scroll-scrubs a <video> with GSAP ScrollTrigger. Replaces the 11.7 MB
 * image-sequence "Lottie" (fizz-lottie-transition.json) with a ~2.4 MB
 * all-intra MP4 (every frame is a keyframe, so seeking is instant).
 *
 * Markup (Webflow Embed or video element custom attributes):
 *   <video data-fizz-scrub
 *          data-trigger=".sticky-track"      CSS selector of the scroll track
 *          data-start="top top"              optional, ScrollTrigger start
 *          data-end="bottom bottom"          optional, ScrollTrigger end
 *          data-src-desktop="https://.../fizz-transition.mp4"
 *          data-src-mobile="https://.../fizz-transition-mobile.mp4"
 *          muted playsinline preload="auto"></video>
 *
 * Load with `defer` AFTER gsap + ScrollTrigger.
 */
(function () {
  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    var mobile = window.matchMedia('(max-width: 767px)').matches;
    document.querySelectorAll('video[data-fizz-scrub]').forEach(function (video) {
      if (video.dataset.fizzScrubBound) return;
      video.dataset.fizzScrubBound = '1';

      var src = (mobile && video.dataset.srcMobile) || video.dataset.srcDesktop;
      if (src) video.src = src;
      video.muted = true;
      video.playsInline = true;
      video.pause();

      var trigger = document.querySelector(video.dataset.trigger) || video.parentElement;
      var target = 0;
      var ready = false;

      function build() {
        if (ready) return;
        ready = true;
        window.ScrollTrigger.create({
          trigger: trigger,
          start: video.dataset.start || 'top top',
          end: video.dataset.end || 'bottom bottom',
          onUpdate: function (self) {
            target = self.progress * video.duration;
          },
        });
        // Ease toward the scroll position once per frame; skip no-op seeks.
        window.gsap.ticker.add(function () {
          var next = video.currentTime + (target - video.currentTime) * 0.3;
          if (Math.abs(next - video.currentTime) > 0.001) video.currentTime = next;
        });
      }

      if (video.readyState >= 1) build();
      else video.addEventListener('loadedmetadata', build, { once: true });
    });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
