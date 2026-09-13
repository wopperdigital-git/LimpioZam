/* ==========================================================================
   SERVICES
   The section pins and holds the screen while the composition assembles itself
   under the reader's scroll: the cards swing clockwise around the heading,
   growing and brightening as they come. The pin releases on the frame the last
   card lands, so the page moves on only once there is nothing left to watch.
   Scrolling back up runs the whole thing in reverse.
   ========================================================================== */

/** How far back along the arc the cards begin, in degrees. */
const SWEEP = 60;

/** Opacity and size the cards start from. */
const FADE_FROM = 0.15;
const SCALE_FROM = 0.5;

/**
 * Fraction of its final radius each card starts at. Swinging in at full radius
 * threw the outer cards well past the frame - 86px of card cut off at the start
 * of the turn and still 25px at seven tenths through - because the composition
 * only just fits at rest, so any backswing puts it outside. Starting them in
 * close means the ring blooms outward as it turns and nothing is ever cut.
 */
const RADIUS_FROM = 0.6;

/**
 * Slack left around the fitted frame. The cards' resting positions all sit
 * inside it, but the arc they travel bulges a little past that envelope on the
 * way in - enough to poke a few pixels out at the narrowest widths, where
 * fitting exactly leaves nothing spare.
 */
const FIT_MARGIN = 0.99;

/** Viewports of scroll the pin holds for. Longer means a slower turn. */
const PIN_VH = 1.5;

/** Orbit centre, in design pixels within the stage - the heading's middle. */
const PIVOT = { x: 720, y: 420 };

const DESIGN = { w: 1440, h: 832 };

export function initServices({ animate, phone }) {
  const section = document.querySelector('.services');

  if (!section) return;

  const stage = section.querySelector('.services__stage');
  const cards = gsap.utils.toArray('.services__card', section);
  const shots = gsap.utils.toArray('.services__shot', section);

  if (!animate) return;

  /* On a phone the stylesheet has abandoned the frame and stacked the cards, so
     there is no ring to turn, no frame to fit and nothing to pin - the orbit's
     whole geometry is gone. Each card rises as it arrives instead. */
  if (phone) {
    gsap.from(cards, {
      autoAlpha: 0,
      y: 30,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 70%' },
    });

    return;
  }

  /**
   * Shrink the design frame to whatever the section can actually show. The
   * frame is sized from 100vw, which counts the scrollbar, and stops shrinking
   * at --u's floor, so it routinely comes out wider than the box that clips it
   * - which is what used to cut the cards on the right. Scaling the frame is
   * the only fix that holds at every width, and it costs nothing: transforms
   * leave layout alone, so everything below still measures in frame pixels.
   */
  const fitStage = () => {
    // Drop any previous override so the frame is measured at the page's own
    // unit, then narrow that unit until the frame fits.
    stage.style.removeProperty('--u');

    const pad = getComputedStyle(section);
    // clientHeight counts padding, and the section reserves a band at its top
    // for the navbar - fitting against that would scale the frame to a box it
    // is not allowed to use, and put the top cards back under the bar.
    const usableH = section.clientHeight
      - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);

    const unit = stage.offsetWidth / DESIGN.w;
    const fit = Math.min(
      1,
      section.clientWidth / stage.offsetWidth,
      usableH / stage.offsetHeight,
    ) * FIT_MARGIN;

    stage.style.setProperty('--u', `${unit * fit}px`);
  };

  /**
   * Each card's resting angle and radius about the pivot. Read from layout so
   * it stays correct at any scale, and recomputed on refresh. offsetLeft/Top
   * rather than a rect: the cards carry a transform for the whole orbit, and a
   * rect would fold both that and the frame's fit scale back into the reading.
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

  /**
   * A single proxy drives every card, so one tween positions the whole ring.
   * Tweening x/y directly would cut a straight line across the arc instead of
   * travelling along it. Angles grow clockwise here, because the y axis points
   * down, so winding back by SWEEP and unwinding to zero is a clockwise arrival.
   *
   * Radius and scale ride the same value rather than tweens of their own: the
   * cards should be at full size exactly when they reach their resting angle,
   * and one source for the whole transform means the three can never disagree.
   */
  const orbit = { t: 0 };

  const placeCards = () => {
    const back = (1 - orbit.t) * SWEEP * (Math.PI / 180);
    const scale = SCALE_FROM + (1 - SCALE_FROM) * orbit.t;
    const reach = RADIUS_FROM + (1 - RADIUS_FROM) * orbit.t;

    geometry.forEach((g) => {
      const a = g.angle - back;
      const r = g.radius * reach;
      gsap.set(g.el, {
        x: Math.cos(a) * r - g.dx,
        y: Math.sin(a) * r - g.dy,
        scale,
      });
    });
  };

  fitStage();
  placeCards();
  ScrollTrigger.addEventListener('refreshInit', () => {
    fitStage();
    geometry = measure();
    placeCards();
  });

  /* Pinned, so the section holds the screen while it assembles rather than
     drifting past. Every tween lands on 1, which is the whole point of the pin:
     it releases on the frame the last card arrives, so the page moves on only
     once there is nothing left to watch. */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + window.innerHeight * PIN_VH,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  // Linear throughout: an eased scrub reads as the page lagging the wheel
  // rather than as the animation being tied to it.
  tl.to(orbit, { t: 1, ease: 'none', duration: 1, onUpdate: placeCards }, 0)
    .fromTo(cards,
      { opacity: FADE_FROM },
      { opacity: 1, ease: 'none', duration: 0.75, stagger: 0.05 }, 0)
    .fromTo(shots,
      { opacity: 0 },
      { opacity: 1, ease: 'none', duration: 0.4, stagger: 0.05 }, 0.5);
}
