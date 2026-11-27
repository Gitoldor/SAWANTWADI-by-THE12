/* Sho1re1 Carousel Focus
 * Keeps clicked cards centered and automatically centres the nearest post
 * whenever the active GPS/tap-to-explore origin changes.
 */
(function () {
  'use strict';

  if (window.__sho1re1CarouselFocusInstalled) return;
  window.__sho1re1CarouselFocusInstalled = true;

  var teleportTimer = null;

  function getCarousel() {
    return document.querySelector('.carousel');
  }

  function centerCard(card, behavior) {
    var carousel = getCarousel();
    if (!carousel || !card || !carousel.contains(card)) return;

    var targetLeft = card.offsetLeft + (card.offsetWidth / 2) -
      (carousel.clientWidth / 2);

    carousel.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: behavior || 'smooth'
    });
  }

  function focusNearestCard() {
    var carousel = getCarousel();
    if (!carousel || typeof activePlaces === 'undefined' ||
        !Array.isArray(activePlaces) || !activePlaces.length ||
        typeof cardRefs === 'undefined' || !Array.isArray(cardRefs) ||
        !cardRefs.length) return;

    // nearby-sort.js sorts activePlaces by the current GPS or tapped origin
    // before dispatching this event, so the first card is the closest valid post.
    var index = -1;
    for (var i = 0; i < activePlaces.length; i++) {
      var place = activePlaces[i];
      if (!place || place.lat == null || place.lng == null ||
          place.lat === '' || place.lng === '') continue;
      var lat = Number(place.lat);
      var lng = Number(place.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) &&
          Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        index = i;
        break;
      }
    }
    var card = index >= 0 ? cardRefs[index] : null;
    if (!card) return;

    if (typeof window.setActive === 'function') {
      window.setActive(index);
    }

    var targetLeft = Math.max(0, card.offsetLeft + card.offsetWidth / 2 -
      carousel.clientWidth / 2);
    var distance = Math.abs(targetLeft - carousel.scrollLeft);
    var smoothLimit = carousel.clientWidth * 1.35;

    if (teleportTimer) {
      clearTimeout(teleportTimer);
      teleportTimer = null;
    }
    carousel.classList.remove('sho1re1-nearest-teleport');
    card.classList.remove('sho1re1-nearest-pop');

    if (distance <= smoothLimit) {
      // Nearby card: glide naturally from the user's current scroll position.
      centerCard(card, 'smooth');
      return;
    }

    // Distant card: avoid a long, slow traverse across every card.
    // Jump the scroll position, then use a short subtle highlight animation.
    carousel.style.scrollBehavior = 'auto';
    carousel.scrollTo({ left: targetLeft, behavior: 'auto' });
    requestAnimationFrame(function () {
      carousel.style.removeProperty('scroll-behavior');
      card.classList.add('sho1re1-nearest-pop');
      carousel.classList.add('sho1re1-nearest-teleport');
      teleportTimer = setTimeout(function () {
        card.classList.remove('sho1re1-nearest-pop');
        carousel.classList.remove('sho1re1-nearest-teleport');
        teleportTimer = null;
      }, 360);
    });
  }

  function install() {
    var carousel = getCarousel();
    if (!carousel || carousel.__sho1re1FocusBound) return;
    carousel.__sho1re1FocusBound = true;

    // Delegation also works for cards recreated after filtering/searching.
    carousel.addEventListener('click', function (event) {
      if (event.target.closest('.card-save-btn')) return;
      var card = event.target.closest('.card');
      if (!card) return;

      // Let the original place-card click run first (it activates the card and map marker).
      requestAnimationFrame(function () {
        centerCard(card, 'smooth');
      });
    });

    // Keep the clicked card highlighted after the carousel's native snap settles.
    carousel.addEventListener('scrollend', function () {
      var cards = carousel.querySelectorAll('.card');
      if (!cards.length) return;

      var center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
      var nearest = null;
      var nearestDistance = Infinity;

      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var distance = Math.abs((rect.left + rect.width / 2) - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = card;
        }
      });

      if (nearest && typeof cardRefs !== 'undefined' &&
          Array.isArray(cardRefs) && typeof window.setActive === 'function') {
        var index = cardRefs.indexOf(nearest);
        if (index >= 0) window.setActive(index);
      }
    });
  }

  // GPS and map-tap origins both dispatch this after the nearby list is sorted
  // and the carousel has been rebuilt.
  window.addEventListener('sho1re1:originchange', function () {
    requestAnimationFrame(focusNearestCard);
  });

  if (!document.getElementById('sho1re1-nearest-card-style')) {
    var style = document.createElement('style');
    style.id = 'sho1re1-nearest-card-style';
    style.textContent = `
      @keyframes sho1re1NearestCardPop {
        0% { opacity: .72; transform: scale(.965); }
        65% { opacity: 1; transform: scale(1.025); }
        100% { opacity: 1; transform: scale(1); }
      }
      .card.sho1re1-nearest-pop {
        animation: sho1re1NearestCardPop 320ms cubic-bezier(.2,.75,.25,1) both;
      }
      @media (prefers-reduced-motion: reduce) {
        .card.sho1re1-nearest-pop { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  // Rebind if a page-level render replaces the carousel element.
  var observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();