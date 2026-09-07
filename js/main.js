/* ==========================================================================
   MAIN - entry point
   GSAP core and its plugins are loaded from the CDN in index.html, so they
   live on the window. Each section owns a module in js/sections/ exporting an
   init function that receives whether it is allowed to animate.
   ========================================================================== */

import { initNavbar } from './navbar.js';
import { initHero } from './sections/hero.js';
import { initReasons } from './sections/reasons.js';
import { initGallery, initGalleryMedia } from './sections/gallery.js';
import { initServices } from './sections/services.js';
import { initTestimonials } from './sections/testimonials.js';
import { initFaq } from './sections/faq.js';

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
  /* Two conditions, so matchMedia rebuilds every section when either flips -
     including on a resize across the phone breakpoint, which is what lets the
     pinned desktop builds and the plain mobile ones swap cleanly.

     Note the callback runs if EITHER matches, so a phone with reduced motion
     still calls in with `animate: false`; every section already returns early
     on that. A desktop with reduced motion matches neither and is never called,
     which is why each section's resting state has to be described in CSS. */
  gsap.matchMedia().add(
    {
      animate: '(prefers-reduced-motion: no-preference)',
      phone: '(max-width: 700px)',
    },
    (context) => {
      const { animate, phone } = context.conditions;

      initHero({ animate, phone });
      initReasons({ animate, phone });
      initGallery({ animate, phone });
      initServices({ animate, phone });
      initTestimonials({ animate, phone });
      initFaq({ animate });
    },
  );
}

async function init() {
  setGsapDefaults();

  // Chrome, not a section: it runs outside the matchMedia so it exists for
  // reduced-motion visitors too, whose sections are never built at all.
  initNavbar();

  // Chrome rather than animation, so it runs outside the matchMedia below -
  // that never fires at all when the visitor has asked for reduced motion.
  // The gallery's clips are the same case: left inside, a reduced-motion
  // visitor would get video elements nothing can ever start.
  initGalleryMedia();

  try {
    await fontsReady();
    initSections();
  } finally {
    revealAnimatedElements();
  }

  console.log(`[LimpioZam] GSAP ${gsap.version} ready.`);
}

document.addEventListener('DOMContentLoaded', init);
