/* Sho1re1: map-only swipe mode.
   Gestures are bound only to overlay UI, never Leaflet's map. */
(() => {
  'use strict';

  if (window.__sho1re1MapOnlySwipeLoaded) return;
  window.__sho1re1MapOnlySwipeLoaded = true;

  const style = document.createElement('style');
  style.id = 'sho1re1-map-only-swipe-style';
  style.textContent = `
    :root {
      --sho-map-slide-duration: 1.45s;
      --sho-map-slide-ease: cubic-bezier(.16,1,.3,1);
    }

    /* All regular overlay pieces descend together, slowly and smoothly. */
    body.sho-map-only #carousel,
    body.sho-map-only #filterContainer {
      transform: translate3d(0, calc(100vh + 80px), 0) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition:
        transform var(--sho-map-slide-duration) var(--sho-map-slide-ease),
        opacity .65s ease !important;
      will-change: transform, opacity;
    }

    /* Recenter sits lower on the map, remaining above the Explore bar and tappable. */
    #map .sho-map-recenter-control {
      transition:
        transform var(--sho-map-slide-duration) var(--sho-map-slide-ease) !important;
      will-change: transform;
    }
    body.sho-map-only #map .sho-map-recenter-control {
      transform: translate3d(0, 205px, 0) !important;
      pointer-events: auto !important;
      z-index: 999999 !important;
    }

    /* Side controls move horizontally, in sync with the cards moving down. */
    body.sho-map-only .sho1re1-ai-button {
      transform: translate3d(calc(-100vw - 100%), 0, 0) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition:
        transform var(--sho-map-slide-duration) var(--sho-map-slide-ease),
        opacity .55s ease !important;
      will-change: transform, opacity;
    }

    body.sho-map-only .saved-posts-btn,
    body.sho-map-only .map-style-btn {
      transform: translate3d(calc(100vw + 100%), 0, 0) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition:
        transform var(--sho-map-slide-duration) var(--sho-map-slide-ease),
        opacity .7s ease !important;
      will-change: transform, opacity;
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
      transition: transform .4s ease, opacity .3s ease;
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
    body:not(.sho-map-only) #sho-map-restore-handle { display: none; }

    @media (prefers-reduced-motion: reduce) {
      body.sho-map-only #carousel,
      body.sho-map-only #filterContainer,
      body.sho-map-only .saved-posts-btn,
      body.sho-map-only .map-style-btn,
      body.sho-map-only .sho1re1-ai-button,
      body.sho-map-only #map .sho-map-recenter-control,
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

  // my-location.js creates Recenter inside #map. Tag only that exact control;
  // no map panes, markers, or Leaflet gesture handlers are modified.
  function tagRecenter() {
    const mapRoot = document.getElementById('map');
    if (!mapRoot) return;
    mapRoot.querySelectorAll('button').forEach(button => {
      if (/recenter|locating/i.test(button.textContent || '')) {
        button.classList.add('sho-map-recenter-control');
      }
    });
  }
  tagRecenter();
  const observer = new MutationObserver(tagRecenter);
  observer.observe(document.getElementById('map') || document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  let startX = 0;
  let startY = 0;
  let active = false;
  let trackingRestore = false;
  let pointerId = null;

  const OVERLAY_SELECTOR = [
    '#carousel', '#filterContainer'
  ].join(',');

  function inOverlay(target) {
    return target instanceof Element && !!target.closest(OVERLAY_SELECTOR);
  }

  function onPointerDown(event) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    const onRestore = event.target === restore || restore.contains(event.target);
    if (document.body.classList.contains('sho-map-only')) {
      if (!onRestore) return;
    } else {
      // Map canvas, Leaflet controls, buttons, links, inputs and page edge zones
      // are excluded so native map interactions remain unaffected.
      if (!inOverlay(event.target)) return;
      if (event.target.closest('button, input, textarea, select, a, .swipe-zone')) return;
      if (event.clientY < window.innerHeight * .14 || event.clientY > window.innerHeight * .92) return;
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