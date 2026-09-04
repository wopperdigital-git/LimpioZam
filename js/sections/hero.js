/* ==========================================================================
   HERO
   Copy settles first, then the deck rises as a three-card stack, holds a beat,
   then fans open. The four outer cards are absent from the stack entirely -
   they sweep up from below the fold as part of the fan.
   ========================================================================== */

/** Timeline positions, in seconds. */
const CUE = {
  logo: 0,
  title: 0.2,
  subtitle: 0.9,
  cta: 1.1,
  rise: 1.4,
  fan: 2.5, // rise ends at 2.3; the gap is the beat at the stacked state
};

/** How far each card peeks out of the stack, in design pixels. */
const STACK_X = [0, 0, -46, 0, 46, 0, 0];

/** Card centre above the hero's bottom edge, in design pixels. */
const CENTRE_Y = [168, 160, 139, 136.5, 139, 160, 168];

/** Card height, in design pixels. */
const HEIGHT = [253, 269, 226, 248, 226, 269, 253];

/** Cards that form the visible stack; the rest arrive with the fan. */
const IN_STACK = [2, 3, 4];

export function initHero({ animate }) {
  const hero = document.querySelector('.hero');

  if (!hero) return;

  const logo = hero.querySelector('.site-header__logo');
  const title = hero.querySelector('.hero__title');
  const subtitle = hero.querySelector('.hero__subtitle');
  const actions = hero.querySelector('.hero__actions');
  const deck = hero.querySelector('.hero__deck');
  const cards = gsap.utils.toArray('.hero__card', hero);
  const slots = gsap.utils.toArray('.hero__card-slot', hero);

  // The stylesheet already describes the finished hero, so there is nothing to
  // do when the visitor has asked for reduced motion.
  if (!animate) return;

  /**
   * The stylesheet's design-pixel unit, measured off real layout.
   * Reading --u directly is no use: a custom property hands back its
   * unresolved `clamp(...)` token string, not a length.
   */
  const designUnit = () => slots[3].getBoundingClientRect().height / HEIGHT[3];

  /** Distance that drops a card just below the hero's bottom edge. */
  const offscreenY = (index) =>
    (CENTRE_Y[index] + HEIGHT[index] / 2 + 24) * designUnit();

  /** Centre of a card's resting position. Slots carry the layout, and GSAP
      never touches them, so they stay a reliable reference while cards animate. */
  const slotCentre = (index) => {
    const r = slots[index].getBoundingClientRect();
    return r.left + r.width / 2;
  };

  /** Distance from a card's resting x to where it sits inside the stack. */
  const stackX = (index) =>
    slotCentre(3) + STACK_X[index] * designUnit() - slotCentre(index);

  const stackCards = IN_STACK.map((i) => cards[i]);
  const sweepCards = cards.filter((_, i) => !IN_STACK.includes(i));
  const fanCards = cards.filter((_, i) => i !== 3);

  const indexOfCard = (card) => cards.indexOf(card);

  /** Each card's resting tilt, read from the stylesheet so it stays the source
      of truth. Safe to parse here where --u was not: `--rot: 16deg` is a plain
      token, and this must not read the live rotation, which the stack has zeroed. */
  const restRotation = (card) => parseFloat(getComputedStyle(card).getPropertyValue('--rot')) || 0;

  // Built inside onSplit so SplitText can revert and rebuild it on a re-split,
  // carrying the playhead across so a resize mid-animation stays seamless.
  const buildTimeline = (lines) => {
    const tl = gsap.timeline();

    tl.from(logo, { autoAlpha: 0, y: -16, duration: 0.7 }, CUE.logo)
      .from(lines, { yPercent: 115, duration: 0.9, stagger: 0.12 }, CUE.title)
      .from(subtitle, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.subtitle)
      .from(actions, { autoAlpha: 0, y: 18, duration: 0.7 }, CUE.cta)

      // Stack the whole deck below the fold, untilted and gathered behind the
      // centre card. Set explicitly rather than leaning on `from` start states:
      // GSAP writes x, y and rotation into one matrix, so a `from` that starts
      // later gets its start value clobbered by an earlier tween on the same card.
      .set(cards, {
        x: (i, el) => stackX(indexOfCard(el)),
        y: (i, el) => offscreenY(indexOfCard(el)),
        rotation: 0,
      }, 0)

      // The stack rises.
      .to(stackCards, { y: 0, duration: 0.9, ease: 'power3.out' }, CUE.rise)

      // The outer four sweep up as the deck opens.
      .to(sweepCards, { y: 0, duration: 1.1, ease: 'power3.out' }, CUE.fan)

      // Everything but the centre card slides and tilts out into the fan.
      .to(fanCards, {
        x: 0,
        rotation: (i, el) => restRotation(el),
        duration: 1.2,
        ease: 'power3.inOut',
      }, CUE.fan);

    return tl;
  };

  /**
   * Exit: the fan closes back into a deck, the outer cards drop away, and the
   * stack fades as section two arrives. Scrubbed against scroll while the hero
   * is pinned, so the visitor drives it and it reverses cleanly.
   *
   * The tweens use immediateRender: false so they record their start values
   * when the scrub first moves rather than at build time, when the entrance
   * still has the cards parked below the fold.
   */
  const buildExit = () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=90%',
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    tl.to(fanCards, {
      x: (i, el) => stackX(indexOfCard(el)),
      rotation: 0,
      ease: 'power2.inOut',
      duration: 0.6,
      immediateRender: false,
    }, 0)
      .to(sweepCards, {
        y: (i, el) => offscreenY(indexOfCard(el)),
        ease: 'power2.in',
        duration: 0.45,
        immediateRender: false,
      }, 0.35)
      .to(deck, { autoAlpha: 0, ease: 'none', duration: 0.25, immediateRender: false }, 0.78);

    return tl;
  };

  buildExit();

  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'hero__title-line',
    onSplit: (self) => buildTimeline(self.lines),
  });
}
