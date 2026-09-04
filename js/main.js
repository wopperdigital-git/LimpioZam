/* ==========================================================================
   MAIN - entry point
   GSAP core is loaded from the CDN in index.html and lives on window.gsap.
   Each section owns a module in js/sections/ that exports an init function.
   ========================================================================== */

// Section imports land here as each section is built:
// import { initHero } from './sections/hero.js';

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
 * Honour the user's reduced-motion preference by making every tween instant.
 */
function respectReducedMotion() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    gsap.globalTimeline.timeScale(200);
  }
}

function init() {
  setGsapDefaults();
  respectReducedMotion();

  // initHero();

  console.log(`[LimpioZam] GSAP ${gsap.version} ready.`);
}

document.addEventListener('DOMContentLoaded', init);
