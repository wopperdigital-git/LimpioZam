/* ==========================================================================
   GALLERY
   The mosaic's layout is entirely CSS. This adds two things on top: the tiles
   rise into place as the section arrives, and each one drifts at its own rate
   while it is on screen, which is what stops eight rectangles on one flat
   colour reading as a static block.

   Deliberately not pinned. The page already holds the reader still twice - for
   the squeegee and for section two's sideways travel - and a third would turn
   a gallery, the one thing here worth simply looking at, into another thing to
   be scrubbed through.
   ========================================================================== */

/**
 * The tiles' arrival.
 *
 * A flat distance, not a percentage. yPercent moves each tile by a share of its
 * own height, and these tiles are deliberately different heights - so the tall
 * one travelled 44px while the short one under it travelled 21px, the gap
 * between them closed, and with a stagger on top the two opaque tiles crossed
 * over each other on the way in. A fixed offset moves every tile the same
 * distance, so the mosaic holds its shape for the whole entrance.
 *
 * No scale here either: the hover below owns that property outright.
 */
const REVEAL = { y: 34, dur: 0.7, stagger: 0.07 };

/**
 * Hover. The tile under the pointer grows, every other one gives way.
 *
 * The figures are chosen against the gap rather than picked for feel, and they
 * had to come down when the tiles started growing directionally. Scaled about
 * its centre a tile splits its growth between two edges; anchored to a corner
 * it spends all of it on one, so the same 1.06 that cleared the gap with room
 * to spare put the largest tile 4.7px into its neighbour on a 1920 screen.
 *
 * At 1.035 the growing edge still travels further than it did at 1.06 centred
 * - 3.5% of the tile against 3% - so the expansion reads as more, not less,
 * while the mosaic keeps a gap everywhere.
 */
const HOVER = { grow: 1.035, shrink: 0.97, dur: 0.45 };

/**
 * How far the middle of the mosaic gives way when an outer tile opens into it,
 * as a share of that tile's own growth. Taken from the hovered tile rather than
 * fixed, so a big tile shoves harder than a small one - which is the only way
 * the movement reads as being caused by the tile rather than merely happening
 * at the same time.
 *
 * Horizontal only. "Outer" is a left-and-right idea, and the tiles that would
 * take a vertical shove are the ones on the top and bottom rows, whose outer
 * edges are exactly what pins the mosaic's silhouette in place.
 */
const PUSH_SHARE = 0.6;

/**
 * How far the picture itself pushes in under the pointer, on top of whatever
 * its tile is doing. Small, and deliberately larger than the tile's own 1.035:
 * the two multiply, so the photograph gains about 9% while its frame gains 3,
 * and the difference between the two is what reads as a zoom rather than as
 * the whole card simply getting bigger.
 */
const MEDIA_ZOOM = 1.06;

/**
 * Parallax range, in pixels of travel across the whole section.
 *
 * Applied to the grid as one plane, never per tile. Giving each tile its own
 * depth is the more obvious way to do this and it is wrong here: these tiles
 * share edges, so any difference in their rates pulls those edges apart - a few
 * pixels was enough to turn a mosaic with one uniform gap into one that looks
 * slightly misaligned. Moving them together keeps every gap exactly as drawn
 * and still gives the mosaic depth against the heading and the orange.
 */
const DRIFT = 26;

/**
 * Video chrome, and the one piece of this section that has to run for every
 * visitor - which is why main.js calls it outside the matchMedia, alongside the
 * navbar. gsap.matchMedia does not call its callback at all when its queries
 * fail, so anything left inside would simply never run for a desktop visitor
 * who has asked for reduced motion, and their clips would be unplayable.
 */
export function initGalleryMedia() {
  const videos = Array.from(document.querySelectorAll('.gallery video'));

  if (videos.length === 0) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (still) {
    // No clip starts by itself here. They get native controls instead, so the
    // footage is still reachable - it just waits to be asked.
    videos.forEach((video) => { video.controls = true; });
    return;
  }

  /* Muted and playing only while on screen: a clip running behind the reader is
     bandwidth and battery spent on something nobody is watching. */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Rejects when the browser declines to start it - a data-saver mode, or
        // a pause() arriving because the tile left the screen before the clip
        // had loaded. Neither needs handling: the poster simply stays up.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach((video) => {
    const tile = video.closest('.gallery__tile');

    video.addEventListener('playing', () => tile?.classList.add('is-playing'));
    video.addEventListener('pause', () => tile?.classList.remove('is-playing'));

    io.observe(video);
  });
}

export function initGallery({ animate, phone }) {
  const section = document.querySelector('.gallery');

  if (!section) return;

  const head = section.querySelector('.gallery__head');
  const tiles = gsap.utils.toArray('.gallery__tile', section);

  // The stylesheet already describes the finished mosaic, so a visitor who has
  // asked for reduced motion sees it whole and still. Unreachable in practice -
  // see initGalleryMedia above - and kept for anyone calling this directly.
  if (!animate) return;

  gsap.from(head.children, {
    autoAlpha: 0,
    y: 26,
    duration: 0.7,
    stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 72%' },
  });

  /* Two things transform a tile, and they own one property each: this reveal
     rises on `y`, the hover below scales. Nothing else touches either - the
     drift is on the grid, a different element, so its own `y` never meets
     this one. Overlapping ownership is what forced the earlier changes here:
     the reveal used to scale as well, which the hover would have fought. */
  gsap.from(tiles, {
    autoAlpha: 0,
    y: REVEAL.y,
    duration: REVEAL.dur,
    stagger: REVEAL.stagger,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top 68%' },
  });

  /* The phone stack is taller than the window on its own, so it already moves
     against the heading as the page scrolls - a drift on top of that only
     shortens the run of orange above and below it. */
  if (phone) return;

  const grid = section.querySelector('.gallery__grid');

  gsap.fromTo(grid,
    { y: DRIFT },
    {
      y: -DRIFT,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

  initHover(grid, tiles);
}

/**
 * The hover, wired on the grid rather than on each tile.
 *
 * Per-tile listeners look like the obvious way and misbehave at exactly the
 * moment that matters: crossing from one tile to the next fires the first
 * tile's leave before the second's enter, so the whole mosaic snaps back to
 * rest for a frame before re-forming. Listening on the container means one
 * handler sees the move as a single change of target, and the gaps between
 * tiles are handled by the same code - the pointer is over the grid itself
 * there, `closest` returns null, and everything settles.
 */
function initHover(grid, tiles) {
  /* Pointer devices only. A touch browser reports a hover on tap and then
     holds it, which would strand a tile enlarged with no way to release it. */
  if (!window.matchMedia('(hover: hover)').matches) return;

  let active = null;

  /* Which way each tile opens, read back off the origin the stylesheet set:
     anchored left means it grows right, anchored right means it grows left,
     and a middle tile opens both ways. Derived rather than listed again here,
     so the shove below can only ever agree with the growth - one table in the
     CSS drives both.

     Banded, not compared exactly. Computed origins come back in fractional
     pixels and offsetWidth is a rounded integer, so a right-anchored tile
     divided out to 1.0008 rather than 1 and an exact test put every one of
     them in the middle - which silently disabled the push entirely. The
     computed width is fractional and shares the border box the percentage
     resolved against, so the two agree. */
  const zoneOf = (el) => {
    const ox = parseFloat(getComputedStyle(el).transformOrigin);
    const w = parseFloat(getComputedStyle(el).width);
    if (!w) return 'middle';
    const ratio = ox / w;
    if (ratio < 0.25) return 'left';    // anchored left, opens right
    if (ratio > 0.75) return 'right';   // anchored right, opens left
    return 'middle';
  };

  const zone = new Map(tiles.map((el) => [el, zoneOf(el)]));

  /* The play badge, gathered once. It rides the tile's scale like everything
     else inside it, and it is the one part that must not: the badge should be
     one size on every tile whatever the hover is doing. Counter-scaling holds
     it still. */
  const chrome = new Map(tiles.map((el) => [el, [
    el.querySelector('.gallery__play'),
  ].filter(Boolean)]));

  /* The picture inside each tile. It is the one thing here that should scale
     with the tile rather than against it - the caption and badge hold still,
     this leans in. Safe to own `scale` outright: nothing else touches the
     media element, and the tile clips it, so the zoom never spills. */
  const media = new Map(tiles.map((el) => [el, el.querySelector('img, video')]));

  const apply = (tile) => {
    if (tile === active) return;
    active = tile;

    /* An outer tile opening inward pushes the middle of the mosaic ahead of
       it. A left tile grows right and shoves right, a right tile does the
       reverse, and a middle tile opens symmetrically and shoves nothing. */
    const from = tile ? zone.get(tile) : 'middle';
    const dir = from === 'left' ? 1 : from === 'right' ? -1 : 0;
    const shove = dir * (tile ? tile.getBoundingClientRect().width : 0)
      * (HOVER.grow - 1) * PUSH_SHARE;

    tiles.forEach((el) => {
      const lifted = el === tile;
      const parts = chrome.get(el);
      // Only the middle of the mosaic gives way, never the hovered tile.
      const gives = !lifted && zone.get(el) === 'middle';

      // Shadow and stacking are CSS, so they are described in one place and
      // transition on their own; only the scale needs tweening here, because
      // GSAP already owns this element's transform and inline styles win.
      el.classList.toggle('is-lifted', lifted);

      const shot = media.get(el);
      if (shot) {
        gsap.to(shot, {
          scale: lifted ? MEDIA_ZOOM : 1,
          duration: HOVER.dur,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }

      gsap.to(el, {
        scale: lifted ? HOVER.grow : (tile ? HOVER.shrink : 1),
        /* Free to use: the grid owns `y` for its drift, each tile owns `y` for
           its reveal and `scale` for the hover. Nothing has claimed `x`. */
        x: gives ? shove : 0,
        duration: HOVER.dur,
        ease: 'power3.out',
        overwrite: 'auto',
        /* Read back off the tile rather than tweened alongside it. Giving the
           chrome its own tween to 1/target would land right and drift on the
           way: the inverse of an eased curve is not that curve, so the labels
           would breathe against their tiles for the whole 0.45s. Taken from
           the live value, the two are exactly reciprocal on every frame. */
        onUpdate: () => {
          const s = gsap.getProperty(el, 'scale');
          gsap.set(parts, { scale: 1 / s });
        },
      });
    });
  };

  grid.addEventListener('pointerover', (e) => {
    apply(e.target.closest('.gallery__tile'));
  });

  // Only fires for the grid as a whole, so moving between tiles never resets.
  grid.addEventListener('pointerleave', () => apply(null));
}
