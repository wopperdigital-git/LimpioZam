/* ==========================================================================
   TESTIMONIALS
   The section pins twice over. First the heading, which arrives oversized,
   shrinks to the size the other sections' headings wear while the deck resolves
   out of the background behind it. Only then does each further scroll step snap
   to the next card.

   Cards are stacked on top of one another; only the active one is visible, and
   the deck's height is tweened between them so the stack grows and shrinks with
   the testimonial rather than being boxed to the longest one.
   ========================================================================== */

/** Seconds for one card to hand over to the next. */
const SWAP = 0.5;

/** How much larger the heading arrives before it settles. */
const TITLE_SCALE = 1.5;

/** Opacity the deck sits at while the heading still owns the section. */
const DECK_FROM = 0.16;

/** Viewports of scroll: the heading's beat, then one per card after it. */
const INTRO_VH = 0.6;
const CARD_VH = 0.75;

export function initTestimonials({ animate, phone }) {
  const section = document.querySelector('.testimonials');

  if (!section) return;

  const deck = section.querySelector('.deck');
  const cardBox = section.querySelector('.deck__cards');
  const cards = gsap.utils.toArray('.deck__card', section);
  const peeks = gsap.utils.toArray('.deck__peek', section);
  const title = section.querySelector('.testimonials__title');

  if (!cardBox || cards.length === 0) return;

  // The reduced-motion fallback lives in the stylesheet, not here: main.js
  // builds sections inside a gsap.matchMedia keyed on `no-preference`, and
  // matchMedia does not run the callback at all when that query fails - so this
  // module is never even called for those visitors. The guard stays for anyone
  // calling it directly.
  if (!animate) return;

  /* On a phone the stylesheet has put every card in the flow as a list, so
     there is no deck to step through, nothing to pin, and no oversized heading
     to shrink - all of that was built on holding one card on screen at a time.
     They just rise as they arrive. */
  if (phone) {
    cards.forEach((card) => {
      gsap.from(card, {
        autoAlpha: 0,
        y: 28,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 88%' },
      });
    });

    gsap.from(title, {
      autoAlpha: 0, y: 20, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 80%' },
    });

    return;
  }

  const last = cards.length - 1;
  let current = 0;

  /** The first card is in flow to give the deck a height; take it out now. */
  gsap.set(cards, { position: 'absolute', autoAlpha: 0 });
  gsap.set(cards[0], { autoAlpha: 1 });
  gsap.set(cardBox, { height: cards[0].offsetHeight });

  /**
   * The peeking shapes are the rest of the stack, so they have to run out as it
   * does. Two left to read means two shapes; on the last card there is nothing
   * behind it and the deck should say so - it used to keep both to the end,
   * which is what stopped it reading as a stack at all.
   */
  const setPeeks = (index, instant) => {
    const remaining = last - index;

    peeks.forEach((peek, i) => {
      const shown = remaining > i;
      gsap.to(peek, {
        autoAlpha: shown ? 1 : 0,
        y: shown ? 0 : -14 - i * 6,   // tucks back under the card as it goes
        duration: instant ? 0 : SWAP,
        ease: 'power2.inOut',
        overwrite: 'auto',
      });
    });
  };

  setPeeks(0, true);

  const show = (next) => {
    if (next === current) return;

    const outgoing = cards[current];
    const incoming = cards[next];
    const forward = next > current;

    current = next;

    /* Read as a stack rather than a cross-fade: the top card lifts away from
       the reader while the one under it rises into its place, so the movement
       has a front and a back instead of two cards trading opacity in the same
       plane. */
    gsap.timeline()
      .to(outgoing, {
        autoAlpha: 0,
        y: forward ? -38 : 30,
        scale: forward ? 1.04 : 0.94,
        duration: SWAP * 0.8,
        ease: 'power2.in',
        overwrite: 'auto',
      }, 0)
      .fromTo(incoming,
        { autoAlpha: 0, y: forward ? 28 : -34, scale: forward ? 0.94 : 1.04 },
        { autoAlpha: 1, y: 0, scale: 1, duration: SWAP, ease: 'power2.out', overwrite: 'auto' },
        0.06)
      // Height alongside, so the peeking shapes below track the new card.
      .to(cardBox, { height: incoming.offsetHeight, duration: SWAP, ease: 'power2.inOut' }, 0);

    setPeeks(next);
  };

  /* ---- the heading's beat ------------------------------------------------ */

  const total = INTRO_VH + CARD_VH * last;
  const introEnd = INTRO_VH / total;

  /* Padded out to a duration of 1 so the scrub maps it across the whole pin,
     while the tweens themselves finish at `introEnd` - the point where the deck
     takes over. */
  const intro = gsap.timeline()
    .fromTo(title,
      { scale: TITLE_SCALE },
      { scale: 1, ease: 'none', duration: introEnd }, 0)
    .fromTo(deck,
      { autoAlpha: DECK_FROM, y: 28 },
      { autoAlpha: 1, y: 0, ease: 'none', duration: introEnd }, 0)
    .to({}, { duration: 1 - introEnd });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + window.innerHeight * total,
    pin: true,
    animation: intro,
    scrub: 0.6,
    // Snapping to whole cards means a scroll always settles on something
    // readable rather than halfway between two testimonials. The heading's beat
    // is left free - snapping there would fight the shrink.
    snap: {
      snapTo: (value) => {
        if (value <= introEnd) return value;
        const step = (1 - introEnd) / last;
        return introEnd + Math.round((value - introEnd) / step) * step;
      },
      duration: { min: 0.2, max: 0.5 },
      ease: 'power1.inOut',
    },
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const past = (self.progress - introEnd) / (1 - introEnd);
      show(gsap.utils.clamp(0, last, Math.round(past * last)));
    },
  });

  // Opacity only. The heading's transform belongs to the intro above, and a
  // second tween on it would fight the shrink.
  gsap.from(title, {
    autoAlpha: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top 80%' },
  });
}
