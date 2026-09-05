/* ==========================================================================
   TESTIMONIALS
   A deliberately quiet section: cards fade up as they arrive, nothing more.
   The two long testimonials collapse to a pull-quote behind a Read more
   control that animates the card's height rather than snapping it.
   ========================================================================== */

/** Swap between the pull-quote and the full text on one card. */
function bindExpander(card) {
  const button = card.querySelector('.testimonials__more');
  const excerpt = card.querySelector('.testimonials__excerpt');
  const full = card.querySelector('.testimonials__full');

  if (!button || !excerpt || !full) return;

  let open = false;
  let busy = false;

  button.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    open = !open;

    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Read less' : 'Read more';

    // Height has to be a number at both ends for the tween to interpolate, so
    // auto is measured first and restored once the card has settled.
    // scrollHeight rather than offsetHeight: when closing, the excerpt is
    // already collapsed to 0, so offsetHeight would animate it 0 -> 0 and the
    // text would snap back at the end instead of easing.
    const excerptHeight = excerpt.scrollHeight;
    const fullHeight = full.scrollHeight;

    gsap.timeline({
      defaults: { duration: 0.5, ease: 'power2.inOut' },
      onComplete: () => {
        // Back to auto so a resize can reflow the card normally.
        gsap.set(full, { height: open ? 'auto' : 0 });
        gsap.set(excerpt, { height: open ? 0 : 'auto' });
        busy = false;
        ScrollTrigger.refresh();
      },
    })
      .to(excerpt, { height: open ? 0 : excerptHeight, autoAlpha: open ? 0 : 1 }, 0)
      .to(full, { height: open ? fullHeight : 0, autoAlpha: open ? 1 : 0 }, 0);
  });
}

export function initTestimonials({ animate }) {
  const section = document.querySelector('.testimonials');

  if (!section) return;

  const title = section.querySelector('.testimonials__title');
  const cards = gsap.utils.toArray('.testimonials__card', section);

  gsap.utils.toArray('.testimonials__card--expandable', section).forEach(bindExpander);

  if (!animate) return;

  gsap.from(title, {
    autoAlpha: 0,
    y: 24,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top 78%' },
  });

  // Each card fades on its own trigger so the columns stay independent as the
  // visitor scrolls, rather than firing as one block.
  cards.forEach((card) => {
    gsap.from(card, {
      autoAlpha: 0,
      y: 32,
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 88%' },
    });
  });
}
