/* ============================================================
   UNIVERSAL.JS
   Shared-post system for Sho1re1 Map

   ?post=1
   → Keeps the normal map UI
   → Keeps all cards visible
   → Selects the requested post on the map
   → Adds Share buttons to cards
   → Adds "View all posts" exit button
============================================================ */

(function () {
    "use strict";

    const CAROUSEL_SELECTOR = "#carousel";
    const CARD_SELECTOR = "#carousel .card";

    let lastSharedId = null;
    let exitButton = null;


    /* ============================================================
       GET CURRENT POSTS
    ============================================================ */

    function getCurrentPosts() {

        try {
            if (
                typeof activePlaces !== "undefined" &&
                Array.isArray(activePlaces)
            ) {
                return activePlaces;
            }
        } catch (e) {}

        try {
            if (
                typeof rawPlaces !== "undefined" &&
                Array.isArray(rawPlaces)
            ) {
                return rawPlaces;
            }
        } catch (e) {}

        if (
            Array.isArray(window.Sho1re1VisiblePlaces)
        ) {
            return window.Sho1re1VisiblePlaces;
        }

        return [];
    }


    /* ============================================================
       FIND POST BY ID
    ============================================================ */

    function findPost(postId) {

        const posts = getCurrentPosts();

        const wanted = String(postId);

        for (let i = 0; i < posts.length; i++) {

            if (
                posts[i] &&
                posts[i].id != null &&
                String(posts[i].id) === wanted
            ) {
                return {
                    post: posts[i],
                    index: i
                };
            }
        }

        return null;
    }


    /* ============================================================
       CREATE SHARE BUTTON
    ============================================================ */

    function createShareButton(card, postId) {

        if (!card || card.querySelector(".UniversalShareButton")) {
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "UniversalShareButton";

        button.setAttribute(
            "aria-label",
            "Share this post"
        );

        button.innerHTML = `
            <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>
                <line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line>
            </svg>
        `;

        button.addEventListener("click", async function (event) {

            event.preventDefault();
            event.stopPropagation();

            const url =
                window.location.origin +
                window.location.pathname +
                "?post=" +
                encodeURIComponent(postId);

            try {

                if (navigator.share) {

                    await navigator.share({
                        title: document.title,
                        text: "Check out this post",
                        url: url
                    });

                } else if (navigator.clipboard) {

                    await navigator.clipboard.writeText(url);

                    button.classList.add("shared");

                    setTimeout(function () {
                        button.classList.remove("shared");
                    }, 1200);

                } else {

                    window.prompt(
                        "Copy this post link:",
                        url
                    );
                }

            } catch (error) {
                // User cancelled share — do nothing.
            }

        });

        card.appendChild(button);
    }


    /* ============================================================
       ADD SHARE BUTTONS TO ALL CURRENT CARDS
    ============================================================ */

    function addShareButtons() {

        const carousel =
            document.querySelector(CAROUSEL_SELECTOR);

        if (!carousel) {
            return;
        }

        const cards =
            carousel.querySelectorAll(".card");

        const posts = getCurrentPosts();

        cards.forEach(function (card, index) {

            const post = posts[index];

            if (!post || post.id == null) {
                return;
            }

            card.dataset.universalPostId =
                String(post.id);

            createShareButton(
                card,
                post.id
            );
        });
    }


    /* ============================================================
       SELECT POST ON EXISTING MAP
    ============================================================ */

    function selectPostOnMap(postId) {

        const result = findPost(postId);

        if (!result) {
            return false;
        }

        const cards =
            document.querySelectorAll(CARD_SELECTOR);

        const card =
            cards[result.index];

        if (!card) {
            return false;
        }


        /* --------------------------------------------------------
           IMPORTANT:
           Use the existing map/card system.

           This does NOT create another page.
           This does NOT create an overlay.
           This does NOT hide the map.
        -------------------------------------------------------- */

        try {

            if (typeof setActive === "function") {
                setActive(result.index);
            }

        } catch (e) {}


        /*
           Trigger the existing card click as well.

           The original card click handler is responsible
           for the existing map movement/flyTo behavior.
        */

        setTimeout(function () {

            try {

                card.click();

            } catch (e) {}

        }, 50);


        /* Scroll only the carousel card into view.
           The map itself remains completely visible. */

        setTimeout(function () {

            try {

                card.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });

            } catch (e) {}

        }, 100);


        card.classList.add("active");

        lastSharedId = String(postId);

        return true;
    }


    /* ============================================================
       EXIT / VIEW ALL POSTS BUTTON
    ============================================================ */

    function createExitButton() {

        if (exitButton) {
            return;
        }

        exitButton = document.createElement("button");

        exitButton.type = "button";

        exitButton.id =
            "UniversalExitSharedPost";

        exitButton.innerHTML =
            "← View all posts";

        exitButton.addEventListener(
            "click",
            exitSharedPost
        );

        document.body.appendChild(
            exitButton
        );
    }


    /* ============================================================
       EXIT SHARED POST
    ============================================================ */

    function exitSharedPost() {

        const url =
            new URL(window.location.href);

        url.searchParams.delete("post");

        window.history.pushState(
            {},
            "",
            url.pathname +
            url.search +
            url.hash
        );

        lastSharedId = null;

        if (exitButton) {

            exitButton.remove();
            exitButton = null;
        }

        /*
           Make sure nothing from the old sharing system
           remains hidden.
        */

        restoreNormalUI();

        document.title =
            document.title.replace(
                /^Post\s*-\s*/i,
                ""
            );
    }


    /* ============================================================
       RESTORE NORMAL MAP UI
    ============================================================ */

    function restoreNormalUI() {

        document
            .querySelectorAll(
                "[data-sho1re1-hidden]"
            )
            .forEach(function (element) {

                element.style.removeProperty(
                    "display"
                );

                element.removeAttribute(
                    "data-sho1re1-hidden"
                );
            });


        document.body.style.removeProperty(
            "overflow"
        );


        document.documentElement.style.removeProperty(
            "overflow"
        );
    }


    /* ============================================================
       REMOVE OLD FULL-PAGE SHARED MODE EFFECTS
    ============================================================ */

    function cancelOldSharedMode() {

        /*
           The older sharing system can mark elements as hidden.

           We deliberately undo those changes because shared
           posts must remain inside the normal map UI.
        */

        restoreNormalUI();


        /*
           Remove old overlay-style elements if the old
           sharing script created any.
        */

        const possibleOldElements = [
            "#Sho1re1SharedPostOverlay",
            "#Sho1re1SharedPostScreen",
            ".Sho1re1SharedPostOverlay",
            ".Sho1re1SharedPostScreen",
            "[data-sho1re1-shared-overlay]"
        ];

        possibleOldElements.forEach(function (selector) {

            document
                .querySelectorAll(selector)
                .forEach(function (element) {

                    element.remove();

                });

        });
    }


    /* ============================================================
       OPEN ?post=ID
    ============================================================ */

    function openSharedPost() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const postId =
            params.get("post");


        /*
           No ?post=...
           → normal map mode.
        */

        if (!postId) {

            cancelOldSharedMode();

            if (exitButton) {
                exitButton.remove();
                exitButton = null;
            }

            return;
        }


        /*
           NEVER hide the map.
           NEVER replace the page.
        */

        cancelOldSharedMode();

        createExitButton();


        /*
           Cards are rendered by the existing app,
           so wait until they exist.
        */

        let attempts = 0;

        const timer =
            setInterval(function () {

                attempts++;

                addShareButtons();

                if (
                    selectPostOnMap(postId)
                ) {

                    clearInterval(timer);

                    document.title =
                        "Post - " +
                        postId +
                        " | Sho1re1";

                    return;
                }


                /*
                   Stop after roughly 10 seconds.
                */

                if (attempts >= 100) {

                    clearInterval(timer);

                }

            }, 100);

    }


    /* ============================================================
       KEEP SHARE BUTTONS WORKING WHEN CARDS ARE RE-RENDERED
    ============================================================ */

    const observer =
        new MutationObserver(function () {

            addShareButtons();

            /*
               If ?post= exists, make sure the selected
               post stays selected after a re-render.
            */

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const postId =
                params.get("post");

            if (
                postId &&
                lastSharedId !== String(postId)
            ) {

                selectPostOnMap(postId);
            }

        });


    /* ============================================================
       INITIALIZE
    ============================================================ */

    function init() {

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );


        addShareButtons();


        /*
           Wait until the existing map app has rendered.
        */

        setTimeout(
            openSharedPost,
            150
        );


        /*
           Browser back/forward support.
        */

        window.addEventListener(
            "popstate",
            function () {

                openSharedPost();

            }
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
