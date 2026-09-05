/* ==========================================================================
   MAIN - hero v2 sandbox entry
   Mirrors js/main.js, but boots only the hero copy so the redesign can be
   worked on without the rest of the page in the way.
   ========================================================================== */

import { initHeroV2 } from './sections/hero-v2.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

function fontsReady(timeout = 3000) {
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => { setTimeout(resolve, timeout); }),
  ]);
}

async function init() {
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });

  try {
    await fontsReady();
    gsap.matchMedia().add(
      { animate: '(prefers-reduced-motion: no-preference)' },
      (context) => { initHeroV2({ animate: context.conditions.animate }); },
    );
  } finally {
    document.documentElement.classList.add('is-anim-ready');
  }

  console.log(`[LimpioZam] hero v2 sandbox - GSAP ${gsap.version} ready.`);
}

document.addEventListener('DOMContentLoaded', init);
