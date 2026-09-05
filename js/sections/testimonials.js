/* ==========================================================================
   TESTIMONIALS
   The section pins and every scroll step snaps to the next card in the deck.
   Cards are stacked on top of one another; only the active one is visible, and
   the deck's height is tweened between them so the stack grows and shrinks
   with the testimonial rather than being boxed to the longest one.
   ========================================================================== */

/** Seconds for one card to hand over to the next. */
const SWAP = 0.45;

export function initTestimonials({ animate }) {
  const section = document.querySelector('.testimonials');

  if (!section) return;

  const deck = section.querySelector('.deck__cards');
  const cards = gsap.utils.toArray('.deck__card', section);
  const title = section.querySelector('.testimonials__title');

  if (!deck || cards.length === 0) return;

  // Without motion the deck cannot be advanced, so show the cards as a plain
  // stacked list rather than hiding four of them behind an inert deck.
  if (!animate) {
    gsap.set(cards, { position: 'relative', marginBottom: '2rem' });
    return;
  }

  let current = 0;

  /** The first card is in flow to give the deck a height; take it out now. */
  gsap.set(cards, { position: 'absolute', autoAlpha: 0 });
  gsap.set(cards[0], { autoAlpha: 1 });
  gsap.set(deck, { height: cards[0].offsetHeight });

  const show = (next) => {
    if (next === current) return;

    const outgoing = cards[current];
    const incoming = cards[next];
    const forward = next > current;

    current = next;

    gsap.timeline({ defaults: { duration: SWAP, ease: 'power2.inOut' } })
      .to(outgoing, { autoAlpha: 0, y: forward ? -18 : 18, scale: 0.97 }, 0)
      .fromTo(incoming,
        { autoAlpha: 0, y: forward ? 22 : -22, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1 }, 0)
      // Height last so the peeking shapes below track the new card.
      .to(deck, { height: incoming.offsetHeight }, 0);
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    // Three quarters of a viewport per card: enough travel that a snap feels
    // deliberate, without making five testimonials cost five screens of scroll.
    end: () => '+=' + window.innerHeight * 0.75 * (cards.length - 1),
    pin: true,
    // Snapping to whole cards means a scroll always settles on something
    // readable rather than halfway between two testimonials.
    snap: {
      snapTo: 1 / (cards.length - 1),
      duration: { min: 0.2, max: 0.5 },
      ease: 'power1.inOut',
    },
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      show(Math.round(self.progress * (cards.length - 1)));
    },
  });

  gsap.from(title, {
    autoAlpha: 0,
    y: 24,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top 75%' },
  });
}
