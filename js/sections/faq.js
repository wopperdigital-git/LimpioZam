/* ==========================================================================
   FAQ
   One answer open at a time. Opening tweens the answer's height and spins the
   arrow; whatever was open closes on the same timeline, so the list settles in
   one movement rather than two competing ones.
   ========================================================================== */

/** Seconds for an answer to open or close. */
const SLIDE = 0.45;

export function initFaq({ animate }) {
  const section = document.querySelector('.faq');

  if (!section) return;

  const items = gsap.utils.toArray('.faq__item', section);

  if (items.length === 0) return;

  let open = null;

  /**
   * Drive one item to a state. Returns the tween so the caller can run the
   * closing and opening halves together.
   */
  const setItem = (item, isOpen) => {
    const button = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');
    const arrow = item.querySelector('.faq__arrow');

    item.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));

    // scrollHeight rather than offsetHeight: when closing, the answer is
    // already collapsed to 0, so offsetHeight would tween it 0 -> 0.
    const target = isOpen ? answer.scrollHeight : 0;

    return gsap.timeline({
      defaults: { duration: SLIDE, ease: 'power2.inOut' },
      onComplete: () => {
        // Back to auto so the answer reflows if the window changes width.
        gsap.set(answer, { height: isOpen ? 'auto' : 0 });
      },
    })
      .to(answer, { height: target, autoAlpha: isOpen ? 1 : 0 }, 0)
      .to(arrow, { rotate: isOpen ? 180 : 0 }, 0);
  };

  items.forEach((item) => {
    item.querySelector('.faq__question').addEventListener('click', () => {
      const closing = open;

      if (closing === item) {
        open = null;
        setItem(item, false);
        return;
      }

      open = item;
      if (closing) setItem(closing, false);
      setItem(item, true);
    });
  });

  if (!animate) return;

  gsap.from(section.querySelector('.faq__title'), {
    autoAlpha: 0,
    y: 24,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top 75%' },
  });

  /* Plain opacity here, not autoAlpha, and it matters for one reason: autoAlpha
     sets visibility:hidden, and a hidden element is out of the tab order
     completely. Every question in this list was therefore unreachable by
     keyboard until the reveal had fired - tabbing down the page went straight
     from the hero's button to the footer's and skipped the FAQ entirely. The
     six buttons are the only scroll-revealed controls on the page, so this is
     the only reveal that needs it. */
  const reveal = gsap.from(items, {
    opacity: 0,
    y: 26,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: { trigger: section.querySelector('.faq__list'), start: 'top 85%' },
  });

  /* Focusing a question scrolls it into view, which fires the reveal anyway -
     but a frame or two later. Finishing it here means focus never lands on a
     control that is still transparent. */
  section.addEventListener('focusin', () => {
    if (reveal.progress() < 1) reveal.progress(1);
  });
}
