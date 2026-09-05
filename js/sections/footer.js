/* ==========================================================================
   FOOTER
   The wordmark drifts upward more slowly than the page, so it appears to be
   revealed from beneath the panel as you reach the bottom.
   ========================================================================== */

/** How much of the wordmark's own height it travels across the scroll. */
const DRIFT = 34;

export function initFooter({ animate }) {
  const footer = document.querySelector('.footer');

  if (!footer) return;

  const word = footer.querySelector('.footer__wordmark span');

  if (!word || !animate) return;

  // Linear, because the movement is tied to scroll position rather than time -
  // any easing would make the drift speed up and slow down against the page.
  gsap.fromTo(word,
    { yPercent: DRIFT },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: footer,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
}
