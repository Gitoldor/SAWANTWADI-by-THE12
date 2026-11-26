/* Sho1re1 Carousel Focus
 * Clicking any card moves it into the center/main position.
 * Works in both directions and leaves map/card rendering code untouched.
 */
(function () {
  'use strict';

  if (window.__sho1re1CarouselFocusInstalled) return;
  window.__sho1re1CarouselFocusInstalled = true;

  function install() {
    var carousel = document.querySelector('.carousel');
    if (!carousel || carousel.__sho1re1FocusBound) return;
    carousel.__sho1re1FocusBound = true;

    function centerCard(card, behavior) {
      if (!card || !carousel.contains(card)) return;

      var targetLeft = card.offsetLeft + (card.offsetWidth / 2) -
        (carousel.clientWidth / 2);

      carousel.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: behavior || 'smooth'
      });
    }

    // Delegation also works for cards recreated after filtering/searching.
    carousel.addEventListener('click', function (event) {
      if (event.target.closest('.card-save-btn')) return;
      var card = event.target.closest('.card');
      if (!card) return;

      // Media-card taps are reserved for opening the player, not carousel focus.
      if (card.classList.contains('media-post') ||
          card.classList.contains('media-reel') ||
          card.classList.contains('media-video')) return;

      // Let the original place-card click run first (it activates the card and map marker).
      requestAnimationFrame(function () {
        centerCard(card, 'smooth');
      });
    });

    // Keep the clicked card centered after the carousel's native snap settles.
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

      if (nearest && typeof window.setActive === 'function' &&
          Array.isArray(window.cardRefs)) {
        var index = window.cardRefs.indexOf(nearest);
        if (index >= 0) window.setActive(index);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  // The carousel element is already in the page, but observe in case it is
  // replaced by another page-level render.
  var observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();