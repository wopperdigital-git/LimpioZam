/* ==========================================================================
   HERO (v2 - redesign sandbox)
   Cards are gone. The copy fades in on load, and on scroll the call to action
   is itself the squeegee: it already carries the rubber blade, so on scroll it
   simply grows and then spreads to fill the screen, handing over to the next
   section's background.

   Loaded only by hero-v2.html; the live hero on index.html is untouched.
   ========================================================================== */

/** Entrance cues, in seconds. */
const CUE = { logo: 0, title: 0.2, subtitle: 0.9, cta: 1.1 };

/** Squeegee proportions, as multiples of the button's own size. */
const SHAPE = {
  lipH: 0.22,    // rubber blade along the bottom, matching the button's own
  growth: 2.3,   // how much bigger it gets before it spreads
};

/**
 * Layout position of an element relative to an ancestor. offsetTop/Left rather
 * than getBoundingClientRect, because the entrance animation leaves a transform
 * on the button's wrapper: a rect read mid-animation bakes that offset into the
 * squeegee and leaves it sitting below the button.
 */
function offsetWithin(el, ancestor) {
  let x = 0;
  let y = 0;
  let node = el;

  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }

  return { x, y };
}

export function initHeroV2({ animate }) {
  const hero = document.querySelector('.hero');

  if (!hero) return;

  const logo = hero.querySelector('.site-header__logo');
  const title = hero.querySelector('.hero__title');
  const subtitle = hero.querySelector('.hero__subtitle');
  const actions = hero.querySelector('.hero__actions');
  const cta = hero.querySelector('.hero__cta');
  const squeegee = hero.querySelector('.squeegee');

  if (!animate || !squeegee) return;

  const head = squeegee.querySelector('.squeegee__head');
  const lip = squeegee.querySelector('.squeegee__lip');

  /**
   * Lay the squeegee out from the button's measured box, so the head starts
   * exactly on top of it and the two are indistinguishable at rest.
   * Re-run on refresh, since every measurement here is scale dependent.
   */
  let base;

  const layout = () => {
    const pos = offsetWithin(cta, hero);

    base = {
      w: cta.offsetWidth,
      h: cta.offsetHeight,
      x: pos.x,
      y: pos.y,
      heroW: hero.offsetWidth,
      heroH: hero.offsetHeight,
    };

    gsap.set(head, { width: base.w, height: base.h, x: base.x, y: base.y });
    gsap.set(lip, {
      width: base.w,
      height: base.h * SHAPE.lipH,
      x: base.x,
      y: base.y + base.h * (1 - SHAPE.lipH),
    });

    // The blade grows about its own bottom edge, so it stays anchored to where
    // the button sat while it gets bigger.
    gsap.set(squeegee, {
      autoAlpha: 1,
      transformOrigin: `${base.x + base.w / 2}px ${base.y + base.h}px`,
    });
  };

  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  /* ---- entrance ---------------------------------------------------------- */

  const entrance = (lines) => gsap.timeline()
    .from(logo, { autoAlpha: 0, y: -16, duration: 0.7 }, CUE.logo)
    .from(lines, { yPercent: 115, duration: 0.9, stagger: 0.12 }, CUE.title)
    .from(subtitle, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.subtitle)
    .from(actions, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.cta);

  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'hero__title-line',
    onSplit: (self) => entrance(self.lines),
  });

  /* ---- scroll morph ------------------------------------------------------ */

  // The button's own label hands over to the squeegee, so the button itself
  // only has to fade; everything after that is the graphic.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=180%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  // 1. the copy clears, on its own beat, before anything else moves
  tl.to([title, subtitle], { autoAlpha: 0, duration: 0.3, ease: 'none' }, 0)

  // The label fades over the squeegee, which is the same size and carries the
  // same blade, so the swap is invisible - the button simply becomes the tool.
    .to(cta, { autoAlpha: 0, duration: 0.15, ease: 'none' }, 0)

  // 2. the squeegee grows, anchored to where the button sat
    .to(squeegee, { scale: SHAPE.growth, duration: 0.4, ease: 'power1.inOut' }, 0.3)

  // 3. the blade spreads to full bleed and becomes the next section's colour.
    // The container unwinds its scale over the same beat, so the head's own
    // width and height land on the hero's exactly rather than 2.3x them.
    .to(squeegee, { scale: 1, duration: 0.25, ease: 'power2.inOut' }, 0.75)
    .to(head, {
      width: () => base.heroW,
      height: () => base.heroH,
      x: 0,
      y: 0,
      borderRadius: 0,
      duration: 0.25,
      ease: 'power2.inOut',
    }, 0.75)
    .to(lip, { autoAlpha: 0, duration: 0.14, ease: 'none' }, 0.75)
    .to(logo, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.8);
}
