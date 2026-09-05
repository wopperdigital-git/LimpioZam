/* ==========================================================================
   MAIN - entry point
   GSAP core and its plugins are loaded from the CDN in index.html, so they
   live on the window. Each section owns a module in js/sections/ exporting an
   init function that receives whether it is allowed to animate.
   ========================================================================== */

import { initHero } from './sections/hero.js';
import { initReasons } from './sections/reasons.js';
import { initServices } from './sections/services.js';
import { initTestimonials } from './sections/testimonials.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Project-wide animation defaults, so individual tweens stay short.
 */
function setGsapDefaults() {
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });
}

/**
 * Reveal the elements CSS is holding back for the on-load animation.
 * Called once every section has rendered its start state.
 */
function revealAnimatedElements() {
  document.documentElement.classList.add('is-anim-ready');
}

/**
 * SplitText measures rendered text, so the webfonts have to be in place before
 * anything splits - otherwise lines break against the fallback font. SplitText's
 * own `autoSplit` re-splits on font load as a backstop, but waiting here avoids
 * the wasted first split. Capped so a stalled font request can never leave the
 * page holding its content back.
 */
function fontsReady(timeout = 3000) {
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => { setTimeout(resolve, timeout); }),
  ]);
}

/**
 * Build every section inside a single matchMedia context. `animate` is false
 * when the visitor asked for reduced motion, and each section is expected to
 * render its finished state directly in that case.
 */
function initSections() {
  gsap.matchMedia().add(
    { animate: '(prefers-reduced-motion: no-preference)' },
    (context) => {
      const { animate } = context.conditions;

      initHero({ animate });
      initReasons({ animate });
      initServices({ animate });
      initTestimonials({ animate });
    },
  );
}

async function init() {
  setGsapDefaults();

  try {
    await fontsReady();
    initSections();
  } finally {
    revealAnimatedElements();
  }

  console.log(`[LimpioZam] GSAP ${gsap.version} ready.`);
}

document.addEventListener('DOMContentLoaded', init);
