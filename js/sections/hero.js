/* ==========================================================================
   HERO
   The card deck is gone. The copy fades in on load, and on scroll the call to action
   is the squeegee - not a stand-in for one. That same element stretches into a
   full-width blade, lifts to the top of the glass and pulls one stroke down,
   leaving the next section's colour behind it.

   Nothing is ever positioned on top of the button, so there is no second copy
   to fall out of register with it when the page is zoomed. The only numbers
   read from the DOM are the button's own height, its offset down the hero, and
   the hero's height - all from the layout tree, all transform-proof.
   ========================================================================== */

/** Entrance cues, in seconds. */
const CUE = { title: 0.2, subtitle: 0.9, cta: 1.1 };

/**
 * The scroll timeline's beats, in its own arbitrary units. The stroke gets
 * roughly half of them, because it is the thing worth watching. Lift and
 * stroke butt up against each other deliberately: leave any gap and the blade
 * sits off the top of the screen with nothing on it. The pause at the top is
 * made by the two easings meeting at zero velocity, not by dead scroll.
 */
const BEAT = {
  labelOut: { at: 0.02, dur: 0.12 },
  stretch: { at: 0.15, dur: 0.3 },
  handleIn: { at: 0.19, dur: 0.27 },
  lift: { at: 0.45, dur: 0.25 },
  stroke: { at: 0.7, dur: 0.6 },
};

/** How many bubbles the wet floor gets. */
const BUBBLES = 30;

/**
 * Scatter bubbles across the hero and set each drifting on its own clock.
 * Every bubble gets its own durations and delays, so the field never falls
 * into step with itself - a dozen bubbles rising in sync reads as a pattern
 * rather than as water.
 *
 * Sizes are in `--u` units like the rest of the hero, so the floor scales with
 * everything else. Returns handles to stop and restart the motion, since once
 * the paint covers the screen these are animating something nobody can see.
 */
function makeSuds(hero) {
  const field = hero.querySelector('.suds');

  if (!field) return { pause() {}, resume() {} };

  const rand = gsap.utils.random;
  const batch = document.createDocumentFragment();
  const bubbles = [];

  for (let i = 0; i < BUBBLES; i += 1) {
    const el = document.createElement('span');
    const size = rand(9, 78);

    el.className = 'suds__bubble';
    el.style.width = `calc(${size.toFixed(1)} * var(--u))`;
    el.style.height = el.style.width;
    el.style.left = `${rand(-3, 99).toFixed(2)}%`;
    // Weighted towards the bottom: it is a floor, not a snowstorm.
    el.style.top = `${(rand(0, 1) ** 0.6 * 104 - 6).toFixed(2)}%`;

    batch.appendChild(el);
    bubbles.push({ el, heft: size / 78 });
  }

  field.appendChild(batch);

  const tweens = bubbles.map(({ el: bubble, heft }) => {
    // Bigger bubbles ride slower, the way real foam does.
    gsap.set(bubble, { opacity: rand(0.35, 0.9) });

    return [
      gsap.to(bubble, {
        y: -rand(40, 150) * (1.2 - heft * 0.6),
        duration: rand(9, 22),
        ease: 'none',
        repeat: -1,
        yoyo: true,
        delay: rand(0, 9),
      }),
      gsap.to(bubble, {
        x: rand(-24, 24),
        duration: rand(5, 12),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: rand(0, 6),
      }),
      gsap.to(bubble, {
        scale: rand(0.86, 1.14),
        opacity: rand(0.22, 0.95),
        duration: rand(4, 10),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: rand(0, 5),
      }),
    ];
  }).flat();

  return {
    pause: () => tweens.forEach((t) => t.pause()),
    resume: () => tweens.forEach((t) => t.resume()),
  };
}

/**
 * How far down an ancestor an element sits, walked from the layout tree rather
 * than read off a rect. offsetTop ignores transforms and ignores whatever
 * ScrollTrigger is doing to the pin at the moment it is asked; a rect does not,
 * and reading one during a refresh put the blade 110px out.
 */
function offsetTopWithin(el, ancestor) {
  let y = 0;
  let node = el;

  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent;
  }

  return y;
}

export function initHero({ animate }) {
  const hero = document.querySelector('.hero');

  if (!hero) return;

  const title = hero.querySelector('.hero__title');
  const subtitle = hero.querySelector('.hero__subtitle');
  const actions = hero.querySelector('.hero__actions');
  const cta = hero.querySelector('.hero__cta');
  const label = hero.querySelector('.hero__cta__label');
  const tool = hero.querySelector('.hero__tool');
  const handle = hero.querySelector('.hero__handle');
  const fill = hero.querySelector('.squeegee__fill');

  // The stylesheet already describes the finished hero, so there is nothing to
  // do when the visitor has asked for reduced motion - not even the entrance.
  if (!animate || !fill) return;

  /* ---- entrance ---------------------------------------------------------- */

  /* Everything that is not a split line animates on its own timeline, outside
     onSplit. SplitText re-runs onSplit whenever it re-splits and reverts the
     timeline it was handed first - which used to park the button at its start
     state, invisible and 18px low, for the rest of the page's life. */
  gsap.timeline()
    .from(subtitle, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.subtitle)
    .from(actions, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.cta);

  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'hero__title-line',
    onSplit: (self) => gsap.from(self.lines, {
      yPercent: 115,
      duration: 0.9,
      stagger: 0.12,
      delay: CUE.title,
    }),
  });

  /* ---- the wet floor ----------------------------------------------------- */

  const suds = makeSuds(hero);

  /* ---- scroll stroke ----------------------------------------------------- */

  /**
   * Re-read on every refresh, since every one of these is scale dependent.
   *
   * Clearing first is not housekeeping, it is the point. The timeline leaves
   * its own output on the tool, and a measurement taken over
   * that reads the last scale rather than this one. Wiping it puts the
   * stylesheet back in charge before anything is measured.
   */
  let base;

  const layout = () => {
    gsap.set([cta, tool, handle], { clearProps: 'all' });
    gsap.set(fill, { height: 0 });

    base = {
      startY: offsetTopWithin(cta, hero),
      ctaW: cta.offsetWidth,
      ctaH: cta.offsetHeight,
      heroW: hero.offsetWidth,
      heroH: hero.offsetHeight,
    };
  };

  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=180%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      // Past the end the paint covers the screen, so the floor is animating
      // something nobody can see.
      onLeave: () => suds.pause(),
      onEnterBack: () => suds.resume(),
    },
  });

  // 1. the label goes, and with it the button's job as a button
  tl.to(label, { autoAlpha: 0, ease: 'none', duration: BEAT.labelOut.dur }, BEAT.labelOut.at)
    .set(cta, { pointerEvents: 'none' }, BEAT.labelOut.at)

  // 2. the head stretches to the full width of the glass, about its own centre.
  //    A transform, not a width: animating the real width writes an inline
  //    figure back onto a live element, the next tween re-records its start
  //    from that stale figure, and after two zooms the button is latched at a
  //    size that fits neither - narrow enough that the label wraps and the
  //    button grows a second line. A scale leaves the layout untouched, so
  //    there is nothing to go stale, and it composites instead of reflowing
  //    on every frame of the stroke.
    .to(cta, {
      scaleX: () => base.heroW / base.ctaW,
      borderRadius: 0,
      ease: 'power2.inOut',
      duration: BEAT.stretch.dur,
    }, BEAT.stretch.at)

  // The handle extends as the head opens out, and only then: at rest this is a
  // button, and a button does not have a handle. It is proportioned against the
  // stretched blade rather than the button - long enough that most of it is off
  // the bottom of the screen at this point - which is why it appears on this
  // beat and not before.
    .fromTo(handle, {
      autoAlpha: 0,
      scaleY: 0.35,
      transformOrigin: '50% 0%',   // extends downward, out of the blade
    }, {
      autoAlpha: 1,
      scaleY: 1,
      ease: 'power2.out',
      duration: BEAT.handleIn.dur,
    }, BEAT.handleIn.at)

  // 3. it lifts to the top of the glass, the way you carry a squeegee up
  //    before pulling it down. It stops with the rubber exactly on the top
  //    edge, so the stroke starts from a clean screen.
    .to(tool, {
      y: () => -(base.startY + base.ctaH),
      ease: 'power2.inOut',
      duration: BEAT.lift.dur,
    }, BEAT.lift.at)

  // 4. the stroke. The blade runs off the bottom, and the paint's lower edge is
  //    the rubber's lower edge the whole way down - driven from the blade's live
  //    position rather than tweened alongside it, so the two cannot drift apart
  //    at any easing. Clamped at both ends, so a stale measurement can only cost
  //    a few pixels of travel, never a visible seam.
    .to(tool, {
      y: () => base.heroH - base.startY,
      ease: 'power1.inOut',
      duration: BEAT.stroke.dur,
      onUpdate: () => {
        const edge = base.startY + base.ctaH + gsap.getProperty(tool, 'y');
        gsap.set(fill, { height: gsap.utils.clamp(0, base.heroH, edge) });
      },
    }, BEAT.stroke.at);
}
