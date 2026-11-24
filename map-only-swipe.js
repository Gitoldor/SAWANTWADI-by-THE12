/* Sho1re1: map-only swipe mode.
   Gestures are intentionally bound only to existing overlay UI, never Leaflet's map.
   Swipe down on cards/controls to reveal the map; swipe up on the small restore handle to return. */
(() => {
  'use strict';

  if (window.__sho1re1MapOnlySwipeLoaded) return;
  window.__sho1re1MapOnlySwipeLoaded = true;

  const STYLE_ID = 'sho1re1-map-only-swipe-style';
  const OVERLAY_SELECTOR = [
    '#carousel',
    '#filterContainer',
    '.brand-image-container',
    '.brand-link',
    '#locationTitle',
    '.saved-posts-btn',
    '.map-style-btn'
  ].join(',');

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Move only the UI layers. The map and all Leaflet panes remain untouched. */
    body.sho-map-only #carousel,
    body.sho-map-only #filterContainer,
    body.sho-map-only .brand-image-container,
    body.sho-map-only .brand-link,
    body.sho-map-only #locationTitle,
    body.sho-map-only .saved-posts-btn,
    body.sho-map-only .map-style-btn {
      transform: translate3d(0, calc(100vh + 40px), 0) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: transform .58s cubic-bezier(.18,.85,.22,1), opacity .28s ease !important;
    }

    #sho-map-restore-handle {
      position: fixed;
      z-index: 1000001;
      left: 50%;
      bottom: max(12px, env(safe-area-inset-bottom));
      width: 76px;
      height: 30px;
      transform: translate3d(-50%, 18px, 0);
      border: 0;
      border-radius: 18px;
      background: rgba(255,255,255,.88);
      box-shadow: 0 4px 18px rgba(0,0,0,.22);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform .35s ease, opacity .25s ease;
      touch-action: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #sho-map-restore-handle::before {
      content: '';
      width: 28px;
      height: 4px;
      border-radius: 8px;
      background: rgba(0,0,0,.58);
    }
    body.sho-map-only #sho-map-restore-handle {
      transform: translate3d(-50%, 0, 0);
      opacity: 1;
      pointer-events: auto;
    }
    body:not(.sho-map-only) #sho-map-restore-handle {
      display: none;
    }
    @media (prefers-reduced-motion: reduce) {
      body.sho-map-only #carousel,
      body.sho-map-only #filterContainer,
      body.sho-map-only .brand-image-container,
      body.sho-map-only .brand-link,
      body.sho-map-only #locationTitle,
      body.sho-map-only .saved-posts-btn,
      body.sho-map-only .map-style-btn,
      #sho-map-restore-handle {
        transition-duration: .01ms !important;
      }
    }
  `;
  document.head.appendChild(style);

  const restore = document.createElement('button');
  restore.type = 'button';
  restore.id = 'sho-map-restore-handle';
  restore.setAttribute('aria-label', 'Show map cards and controls');
  restore.title = 'Swipe up to show places';
  document.body.appendChild(restore);

  let startX = 0;
  let startY = 0;
  let active = false;
  let trackingRestore = false;
  let pointerId = null;

  function inOverlay(target) {
    return target instanceof Element && !!target.closest(OVERLAY_SELECTOR);
  }

  function onPointerDown(event) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    const onRestore = event.target === restore || restore.contains(event.target);
    if (document.body.classList.contains('sho-map-only')) {
      if (!onRestore) return;
    } else {
      // Do not observe map touches, Leaflet markers, map controls, page swipe zones,
      // modals, or form controls. This keeps map panning/zooming completely native.
      if (!inOverlay(event.target)) return;
      if (event.target.closest('button, input, textarea, select, a, .swipe-zone')) return;
      if (event.clientY < window.innerHeight * 0.14 || event.clientY > window.innerHeight * 0.92) return;
    }

    startX = event.clientX;
    startY = event.clientY;
    active = true;
    trackingRestore = onRestore;
    pointerId = event.pointerId;
  }

  function onPointerUp(event) {
    if (!active || event.pointerId !== pointerId) return;
    active = false;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    pointerId = null;

    // Require a clear vertical gesture, with a deliberate travel distance.
    if (Math.abs(dy) < 75 || Math.abs(dy) < Math.abs(dx) * 1.35) return;

    if (!trackingRestore && dy > 0) {
      document.body.classList.add('sho-map-only');
    } else if (trackingRestore && dy < 0) {
      document.body.classList.remove('sho-map-only');
    }
  }

  function cancelPointer() {
    active = false;
    pointerId = null;
  }

  document.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
  document.addEventListener('pointerup', onPointerUp, { passive: true, capture: true });
  document.addEventListener('pointercancel', cancelPointer, { passive: true, capture: true });
  restore.addEventListener('click', () => document.body.classList.remove('sho-map-only'));
})();