/* ==========================================================================
   REASONS - "What Makes Us Different"
   The section pins and its strip travels horizontally, so vertical scrolling
   reads as sideways movement. Items fade up as they enter the viewport, which
   needs ScrollTrigger's containerAnimation because they are moved by a tween
   rather than by the scroller itself.
   ========================================================================== */

export function initReasons({ animate, phone }) {
  const section = document.querySelector('.reasons');

  if (!section) return;

  const viewport = section.querySelector('.reasons__viewport');
  const strip = section.querySelector('.reasons__strip');
  const intro = section.querySelector('.reasons__intro');
  const items = gsap.utils.toArray('.reasons__item', section);

  // Without motion the strip stays an ordinary horizontal scroller, which is
  // what the stylesheet already gives us.
  if (!animate) return;

  /* The waves arrive with the section: each band slides in along its own
     diagonal and fades up, one after another. Keyed off the page's scroll on
     both layouts, so a phone gets the same entrance as a desktop. From-values
     only - the stylesheet describes the finished field, which is exactly what
     a reduced-motion visitor sees. The slide is the 0.3 of the section's width
     that the field's oversizing in reasons.css was measured against. */
  gsap.from(gsap.utils.toArray('.reasons__wave', section), {
    autoAlpha: 0,
    x: () => -0.3 * section.offsetWidth,
    duration: 1.6,
    ease: 'power2.out',
    stagger: 0.12,
    scrollTrigger: { trigger: section, start: phone ? 'top 75%' : 'top 60%' },
  });

  /* On a phone the stylesheet has already turned the strip into a vertical
     stack, so there is nothing to travel sideways and nothing to pin. Each
     block just rises as it arrives, keyed off the page's own scroll. */
  if (phone) {
    gsap.from(intro.children, {
      autoAlpha: 0, y: 24, duration: 0.6, stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 78%' },
    });

    items.forEach((item) => {
      gsap.from([item.querySelector('.reasons__copy'), item.querySelector('.reasons__card')], {
        autoAlpha: 0, y: 28, duration: 0.55, stagger: 0.1,
        scrollTrigger: { trigger: item, start: 'top 85%' },
      });
    });

    return;
  }

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

  /* The wave field drifts the same way as the strip at under a third of its
     speed, so it reads as a layer behind it rather than as part of it. Its own
     trigger over exactly the pinned range rather than a part of `slide`: the
     items key off that tween through containerAnimation, which wants the strip
     alone. Nothing to size - the field is oversized in CSS, so the only thing
     set here is `x`, and gsap.matchMedia reverts that when a phone takes over. */
  gsap.to(section.querySelector('.reasons__waves-drift'), {
    x: () => -travel() * 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + travel(),
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
