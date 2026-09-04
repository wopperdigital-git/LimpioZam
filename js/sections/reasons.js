/* ==========================================================================
   REASONS - "What Makes Us Different"
   The section pins and its strip travels horizontally, so vertical scrolling
   reads as sideways movement. Items fade up as they enter the viewport, which
   needs ScrollTrigger's containerAnimation because they are moved by a tween
   rather than by the scroller itself.
   ========================================================================== */

export function initReasons({ animate }) {
  const section = document.querySelector('.reasons');

  if (!section) return;

  const viewport = section.querySelector('.reasons__viewport');
  const strip = section.querySelector('.reasons__strip');
  const intro = section.querySelector('.reasons__intro');
  const items = gsap.utils.toArray('.reasons__item', section);

  // Without motion the strip stays an ordinary horizontal scroller, which is
  // what the stylesheet already gives us.
  if (!animate) return;

  viewport.style.overflow = 'hidden';

  /** How far the strip has to move for its right edge to reach the viewport's. */
  const travel = () => Math.max(0, strip.scrollWidth - window.innerWidth);

  // Must be a linear ease: containerAnimation maps scroll position through this
  // tween, and anything else would desynchronise the nested triggers.
  const slide = gsap.to(strip, {
    x: () => -travel(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + travel(),
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  // The intro is already on screen when the section arrives, so it keys off the
  // normal scroller rather than the horizontal tween.
  gsap.from(intro.children, {
    autoAlpha: 0,
    y: 28,
    duration: 0.7,
    stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 70%' },
  });

  items.forEach((item) => {
    gsap.from([item.querySelector('.reasons__copy'), item.querySelector('.reasons__card')], {
      autoAlpha: 0,
      y: 40,
      duration: 0.6,
      stagger: 0.12,
      scrollTrigger: {
        trigger: item,
        containerAnimation: slide,
        start: 'left 88%',
      },
    });
  });
}
