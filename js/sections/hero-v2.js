/* ==========================================================================
   HERO (v2 - redesign sandbox)
   Cards are gone. The copy fades in on load, and on scroll the call to action
   turns into a squeegee: a handle grows out of it, the whole tool scales up,
   then the head spreads to fill the screen and hands over to the next
   section's background.

   Loaded only by hero-v2.html; the live hero on index.html is untouched.
   ========================================================================== */

/** Entrance cues, in seconds. */
const CUE = { logo: 0, title: 0.2, subtitle: 0.9, cta: 1.1 };

/** Squeegee proportions, as multiples of the button's own size. */
const SHAPE = {
  handleW: 0.085,   // shaft width
  handleH: 2.6,     // shaft height
  gripW: 0.26,      // cap across the top of the shaft
  gripH: 0.34,
  lipH: 0.22,       // rubber strip along the bottom of the blade
  growth: 2.3,      // how much bigger the tool gets before it spreads
};

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
  const handle = squeegee.querySelector('.squeegee__handle');
  const grip = squeegee.querySelector('.squeegee__grip');

  /**
   * Lay the squeegee out from the button's measured box, so the head starts
   * exactly on top of it and the two are indistinguishable at rest.
   * Re-run on refresh, since every measurement here is scale dependent.
   */
  let base;

  const layout = () => {
    const b = cta.getBoundingClientRect();
    const h = hero.getBoundingClientRect();

    base = {
      w: b.width,
      h: b.height,
      x: b.left - h.left,
      y: b.top - h.top,
      heroW: h.width,
      heroH: h.height,
    };

    const cx = base.x + base.w / 2;

    gsap.set(head, { width: base.w, height: base.h, x: base.x, y: base.y });
    gsap.set(lip, {
      width: base.w,
      height: base.h * SHAPE.lipH,
      x: base.x,
      y: base.y + base.h * (1 - SHAPE.lipH),
    });
    // Handle and grip start collapsed into the blade and grow out of it.
    gsap.set(handle, {
      width: base.w * SHAPE.handleW,
      height: base.h * SHAPE.handleH,
      x: cx - (base.w * SHAPE.handleW) / 2,
      y: base.y - base.h * SHAPE.handleH,
      scaleY: 0,
    });
    gsap.set(grip, {
      width: base.w * SHAPE.gripW,
      height: base.h * SHAPE.gripH,
      x: cx - (base.w * SHAPE.gripW) / 2,
      y: base.y - base.h * SHAPE.handleH - base.h * SHAPE.gripH,
      scaleY: 0,
      autoAlpha: 0,
    });

    // The whole tool scales as one rigid object about the blade's bottom edge.
    // .squeegee spans the hero, so its own box coordinates are hero coordinates.
    gsap.set(squeegee, {
      autoAlpha: 1,
      transformOrigin: `${cx}px ${base.y + base.h}px`,
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

  // 1. the copy clears. A long linear fade rather than a quick blip, and the
  // handle waits until it is done so nothing grows through the subtitle.
  tl.to([title, subtitle], { autoAlpha: 0, duration: 0.3, ease: 'none' }, 0)

  // The label fades over the squeegee's own head, which is the same size and
  // now carries the same blade, so the swap is invisible.
    .to(cta, { autoAlpha: 0, duration: 0.15, ease: 'none' }, 0)

  // 2. the tool assembles on a clear stage, then grows
    .to(handle, { scaleY: 1, duration: 0.22, ease: 'power2.out' }, 0.3)
    .to(grip, { scaleY: 1, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0.46)
    .to(squeegee, { scale: SHAPE.growth, duration: 0.27, ease: 'power1.inOut' }, 0.55)

  // 3. the head spreads to full bleed and becomes the next section's colour.
    // The container unwinds its scale over the same beat, so the head's own
    // width and height land on the hero's exactly rather than 2.3x them.
    .to(squeegee, { scale: 1, duration: 0.18, ease: 'power2.inOut' }, 0.82)
    .to(head, {
      width: () => base.heroW,
      height: () => base.heroH,
      x: 0,
      y: 0,
      borderRadius: 0,
      duration: 0.18,
      ease: 'power2.inOut',
    }, 0.82)
    .to([lip, handle, grip], { autoAlpha: 0, duration: 0.1, ease: 'none' }, 0.82)
    .to(logo, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 0.85);
}
