/* ==========================================================================
   SERVICES
   Four stages, played once when the section arrives:
     1. cards sweep along an arc around the heading, fading in as they travel
     2. they settle at full strength
     3. each card's copy fades down from above
     4. the image stand-ins fade in behind them
   ========================================================================== */

/** How far back along the arc the cards begin, in degrees. */
const SWEEP = 60;

/** Orbit centre, in design pixels within the stage - the heading's middle. */
const PIVOT = { x: 637, y: 420 };

const DESIGN = { w: 1280, h: 832 };

export function initServices({ animate }) {
  const section = document.querySelector('.services');

  if (!section) return;

  const stage = section.querySelector('.services__stage');
  const cards = gsap.utils.toArray('.services__card', section);
  const shots = gsap.utils.toArray('.services__shot', section);
  const copy = cards.map((c) => [...c.children]);

  if (!animate) return;

  /**
   * Each card's resting angle and radius about the pivot. Read from layout so
   * it stays correct at any scale, and recomputed on refresh.
   */
  const measure = () => {
    const px = stage.offsetWidth / DESIGN.w;
    const pivotX = PIVOT.x * px;
    const pivotY = PIVOT.y * px;

    return cards.map((el) => {
      const dx = el.offsetLeft + el.offsetWidth / 2 - pivotX;
      const dy = el.offsetTop + el.offsetHeight / 2 - pivotY;
      return { el, dx, dy, radius: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
    });
  };

  let geometry = measure();
  ScrollTrigger.addEventListener('refreshInit', () => { geometry = measure(); });

  // A single proxy drives every card, so one tween positions the whole ring.
  // Tweening x/y directly would cut a straight line across the arc.
  const orbit = { t: 0 };
  const placeCards = () => {
    const back = (1 - orbit.t) * SWEEP * (Math.PI / 180);
    geometry.forEach((g) => {
      const a = g.angle - back;
      gsap.set(g.el, {
        x: Math.cos(a) * g.radius - g.dx,
        y: Math.sin(a) * g.radius - g.dy,
      });
    });
  };

  placeCards();

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: section, start: 'top 65%' },
  });

  tl.to(orbit, { t: 1, duration: 1.5, ease: 'power3.out', onUpdate: placeCards }, 0)
    .from(cards, { autoAlpha: 0, duration: 1.1, stagger: 0.06 }, 0)
    .from(copy.flat(), { autoAlpha: 0, y: -18, duration: 0.55, stagger: 0.05 }, 1.35)
    .from(shots, { autoAlpha: 0, duration: 0.7, stagger: 0.12 }, 2.0);
}
