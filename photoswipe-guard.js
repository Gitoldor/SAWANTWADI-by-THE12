
(function () {
  "use strict";

  const sharedPost = new URLSearchParams(location.search).has("post");

  if (!sharedPost) return;

  const blocked = ["photoswipe.js", "install.js"];

  // Stop matching scripts from being inserted
  const originalAppend = Node.prototype.appendChild;
  const originalInsert = Node.prototype.insertBefore;

  function isBlocked(node) {
    return (
      node &&
      node.tagName === "SCRIPT" &&
      blocked.some(file => (node.src || "").includes(file))
    );
  }

  Node.prototype.appendChild = function (node) {
    if (isBlocked(node)) return node;
    return originalAppend.call(this, node);
  };

  Node.prototype.insertBefore = function (node, ref) {
    if (isBlocked(node)) return node;
    return originalInsert.call(this, node, ref);
  };

  // Remove their existing UI if present
  function clean() {
    document.querySelectorAll(
      "#photoSwipePlugin, #photoSwipePluginStyle, #installPlugin, #installButton, #installBanner"
    ).forEach(el => el.remove());
  }

  clean();

  new MutationObserver(clean).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log("Shared post: install and PhotoSwipe blocked.");
})();
