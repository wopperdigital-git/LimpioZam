/* ==========================================================================
   NAVBAR
   Two things, both driven straight off scroll position: the glass state, and
   the fade across the hero.

   Deliberately plain DOM rather than ScrollTrigger. This is chrome, so it has
   to run for every visitor - including the ones who asked for reduced motion,
   for whom main.js's matchMedia never calls a section at all.
   ========================================================================== */

/** Pixels of scroll before the bar takes on its glass. */
const GLASS_AT = 8;

/**
 * Where the bar is gone, as a fraction of the hero's scroll. It clears out
 * early, stays out while the squeegee has the screen, and is back by the time
 * the next section arrives.
 */
const FADE_OUT_BY = 0.28;
const FADE_IN_FROM = 0.82;

export function initNavbar() {
  const bar = document.querySelector('.navbar');
  const panel = document.querySelector('.navbar__bar');
  const next = document.querySelector('.reasons');
  /* Section two is no longer the only full bleed of brand orange - the gallery
     sits on the same colour directly below it. Marked in the markup rather than
     listed by class here, so a later orange section needs no edit to this file. */
  const grounds = Array.from(document.querySelectorAll('[data-ground="orange"]'));

  if (!bar) return;

  /**
   * Whether the bar is currently sitting over a given section. Measured off the
   * element rather than its pin spacer: the spacer holds the place in the flow,
   * but the element is what is actually painted under the bar.
   */
  const barOver = (el) => {
    if (!el || !panel) return false;
    const b = panel.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.top < b.bottom && r.bottom > b.top;
  };

  /**
   * Document position where the hero's scroll ends. The hero is pinned, so its
   * own box stops moving - the pin spacer is what actually occupies the flow,
   * and the next section's top is the honest end of the hero's stretch.
   */
  const heroRun = () => {
    if (!next) return 0;
    const box = next.parentElement.classList.contains('pin-spacer')
      ? next.parentElement
      : next;
    return box.getBoundingClientRect().top + window.scrollY;
  };

  let run = heroRun();

  const sync = () => {
    const y = window.scrollY;

    bar.classList.toggle('is-scrolled', y > GLASS_AT);
    // The orange grounds are full bleeds of the brand colour, on which the
    // bar's ordinary colours all but disappear. Everything flips over them.
    bar.classList.toggle('is-over-orange', grounds.some(barOver));

    // Fade out over the hero and back in as the next section lands. Held at a
    // flat 0 in between rather than easing through, so the bar is genuinely
    // out of the way for the whole of the squeegee's stroke.
    let shown = 1;

    if (run > 0) {
      const t = y / run;
      if (t >= 1) shown = 1;
      else if (t <= FADE_OUT_BY) shown = 1 - t / FADE_OUT_BY;
      else if (t < FADE_IN_FROM) shown = 0;
      else shown = (t - FADE_IN_FROM) / (1 - FADE_IN_FROM);
    }

    bar.style.opacity = shown.toFixed(3);
    // Gone means gone: a bar at zero opacity still takes clicks.
    bar.style.visibility = shown < 0.02 ? 'hidden' : '';
  };

  const remeasure = () => { run = heroRun(); sync(); };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', remeasure);
  // The pin spacers only exist once the sections have built, and they are what
  // `run` is measured against.
  window.addEventListener('load', remeasure);
  if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', remeasure);
}
