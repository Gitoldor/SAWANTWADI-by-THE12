/* ============================================================
   SHO1RE1 UNIVERSAL SHARING SYSTEM
   ============================================================

   URL FORMAT:

   index.html?post=1
   index.html?post=3
   index.html?post=welcome

   NORMAL PAGE:
   - Everything works normally

   SHARED PAGE:
   - Entire original UI is hidden
   - Only the selected card is displayed
   - No map
   - No search controls
   - No category buttons
   - No black space below
   - Full-screen shared view
   - View All Posts button

   IMPORTANT:
   This file is designed to work WITHOUT modifying
   your existing card-rendering code.
============================================================ */


/* ============================================================
   CONFIG
============================================================ */

const SHO1RE1_UNIVERSAL = {

    overlayId: "Sho1re1UniversalOverlay",

    shareButtonClass:
        "Sho1re1UniversalShareButton",

    exitButtonId:
        "Sho1re1UniversalExitButton",

    scanInterval: 700,

    maxScanTime: 30000

};


/* ============================================================
   GET POSTS
============================================================ */

function Sho1re1UniversalGetPosts() {

    /*
       Your app already exposes:

       window.Sho1re1VisiblePlaces
    */

    if (
        Array.isArray(
            window.Sho1re1VisiblePlaces
        )
    ) {

        return window.Sho1re1VisiblePlaces;

    }


    /*
       Fallback
    */

    if (
        Array.isArray(
            window.Sho1re1Places
        )
    ) {

        return window.Sho1re1Places;

    }


    return [];

}


/* ============================================================
   GET ACTIVE POSTS
============================================================ */

function Sho1re1UniversalGetActivePosts() {

    /*
       Your renderer uses activePlaces.

       Try it first because it represents
       the cards currently being rendered.
    */

    if (
        Array.isArray(
            window.activePlaces
        )
    ) {

        return window.activePlaces;

    }


    return Sho1re1UniversalGetPosts();

}


/* ============================================================
   GET POST ID FROM URL
============================================================ */

function Sho1re1UniversalGetPostID() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("post");

}


/* ============================================================
   CREATE POST URL
============================================================ */

function Sho1re1UniversalGetPostURL(post) {

    if (
        !post ||
        post.id === undefined ||
        post.id === null
    ) {

        return null;

    }


    const url =
        new URL(
            window.location.href
        );


    /*
       Keep pathname.

       Remove old query parameters.
    */

    url.search = "";


    url.searchParams.set(
        "post",
        String(post.id)
    );


    return url.toString();

}


/* ============================================================
   FIND POST BY ID
============================================================ */

function Sho1re1UniversalFindPost(id) {

    if (!id) return null;


    const posts =
        Sho1re1UniversalGetPosts();


    for (
        let i = 0;
        i < posts.length;
        i++
    ) {

        const post =
            posts[i];


        if (
            post &&
            String(post.id) ===
            String(id)
        ) {

            return post;

        }

    }


    /*
       Try active posts too.
    */

    const active =
        Sho1re1UniversalGetActivePosts();


    for (
        let i = 0;
        i < active.length;
        i++
    ) {

        const post =
            active[i];


        if (
            post &&
            String(post.id) ===
            String(id)
        ) {

            return post;

        }

    }


    return null;

}


/* ============================================================
   GET CARDS
============================================================ */

function Sho1re1UniversalGetCards() {

    const carousel =
        document.getElementById(
            "carousel"
        );


    if (!carousel) {

        return [];

    }


    return Array.from(
        carousel.querySelectorAll(
            ".card"
        )
    );

}


/* ============================================================
   FIND CARD FOR POST
============================================================ */

function Sho1re1UniversalFindCard(post) {

    if (!post) return null;


    const cards =
        Sho1re1UniversalGetCards();


    /*
       First check if a card already has
       our universal ID.
    */

    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const card =
            cards[i];


        if (
            String(
                card.dataset.sho1re1PostId
            ) ===
            String(post.id)
        ) {

            return card;

        }

    }


    /*
       Your existing renderer creates cards
       in the same order as activePlaces.

       Therefore map the card index to
       activePlaces.
    */

    const activePosts =
        Sho1re1UniversalGetActivePosts();


    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const activePost =
            activePosts[i];


        if (
            activePost &&
            String(activePost.id) ===
            String(post.id)
        ) {

            cards[i].dataset.sho1re1PostId =
                String(activePost.id);


            return cards[i];

        }

    }


    /*
       Fallback to visible posts.
    */

    const visiblePosts =
        Sho1re1UniversalGetPosts();


    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const visiblePost =
            visiblePosts[i];


        if (
            visiblePost &&
            String(visiblePost.id) ===
            String(post.id)
        ) {

            cards[i].dataset.sho1re1PostId =
                String(visiblePost.id);


            return cards[i];

        }

    }


    return null;

}


/* ============================================================
   ADD SHARE BUTTONS
============================================================ */

function Sho1re1UniversalAddShareButtons() {

    const cards =
        Sho1re1UniversalGetCards();


    const posts =
        Sho1re1UniversalGetActivePosts();


    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const card =
            cards[i];


        const post =
            posts[i];


        if (!post) continue;


        /*
           Store ID directly on card.
        */

        card.dataset.sho1re1PostId =
            String(post.id);


        /*
           Don't create duplicate.
        */

        if (
            card.querySelector(
                "." +
                SHO1RE1_UNIVERSAL.shareButtonClass
            )
        ) {

            continue;

        }


        /*
           If your existing app already has
           a share button, don't create another.
        */

        if (
            card.querySelector(
                ".Sho1re1AutoShareButton"
            )
        ) {

            continue;

        }


        /* ====================================================
           BUTTON
        ==================================================== */

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            SHO1RE1_UNIVERSAL.shareButtonClass;


        button.setAttribute(
            "aria-label",
            "Share post"
        );


        button.setAttribute(
            "title",
            "Share"
        );


        /*
           SVG share icon
        */

        button.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
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

                <line
                    x1="8.59"
                    y1="13.51"
                    x2="15.42"
                    y2="17.49"
                ></line>

                <line
                    x1="15.41"
                    y1="6.51"
                    x2="8.59"
                    y2="10.49"
                ></line>
            </svg>
        `;


        /*
           Position top-right.
        */

        button.style.position =
            "absolute";


        button.style.top =
            "14px";


        button.style.right =
            "14px";


        button.style.width =
            "48px";


        button.style.height =
            "48px";


        button.style.display =
            "flex";


        button.style.alignItems =
            "center";


        button.style.justifyContent =
            "center";


        button.style.padding =
            "0";


        button.style.border =
            "none";


        button.style.borderRadius =
            "50%";


        button.style.background =
            "rgba(20,20,20,.82)";


        button.style.color =
            "#fff";


        button.style.cursor =
            "pointer";


        button.style.zIndex =
            "50";


        button.style.backdropFilter =
            "blur(10px)";


        button.style.webkitBackdropFilter =
            "blur(10px)";


        button.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.25)";


        /*
           Stop card click.
        */

        button.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

            }
        );


        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                Sho1re1UniversalShare(
                    post
                );

            }
        );


        card.appendChild(
            button
        );

    }

}


/* ============================================================
   SHARE POST
============================================================ */

async function Sho1re1UniversalShare(post) {

    const url =
        Sho1re1UniversalGetPostURL(
            post
        );


    if (!url) return;


    const shareData = {

        title:
            post.title ||
            "Sawantwadi",

        text:
            post.title ||
            "Check out this post",

        url:
            url

    };


    /*
       Native Android / browser sharing
    */

    if (
        navigator.share
    ) {

        try {

            await navigator.share(
                shareData
            );

            return;

        }

        catch (error) {

            /*
               User cancelled share.
            */

            if (
                error &&
                error.name ===
                "AbortError"
            ) {

                return;

            }

        }

    }


    /*
       Clipboard fallback
    */

    try {

        await navigator.clipboard.writeText(
            url
        );


        Sho1re1UniversalToast(
            "Post link copied"
        );


        return;

    }

    catch (error) {

        /*
           Last fallback.
        */

        window.prompt(
            "Copy this post link:",
            url
        );

    }

}


/* ============================================================
   TOAST
============================================================ */

function Sho1re1UniversalToast(message) {

    const old =
        document.getElementById(
            "Sho1re1UniversalToast"
        );


    if (old) {

        old.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.id =
        "Sho1re1UniversalToast";


    toast.textContent =
        message;


    toast.style.position =
        "fixed";


    toast.style.left =
        "50%";


    toast.style.bottom =
        "25px";


    toast.style.transform =
        "translateX(-50%)";


    toast.style.zIndex =
        "100000000";


    toast.style.padding =
        "12px 18px";


    toast.style.borderRadius =
        "999px";


    toast.style.background =
        "#111";


    toast.style.color =
        "#fff";


    toast.style.fontSize =
        "14px";


    toast.style.fontWeight =
        "600";


    toast.style.boxShadow =
        "0 8px 30px rgba(0,0,0,.4)";


    document.body.appendChild(
        toast
    );


    setTimeout(
        function() {

            if (toast) {

                toast.remove();

            }

        },
        2200
    );

}


/* ============================================================
   REMOVE OLD APP SHARING MODE
============================================================ */

function Sho1re1UniversalClearOldSharing() {

    /*
       Your existing app.js uses:

       [data-sho1re1-hidden]

       Remove that old hiding.
    */

    const hidden =
        document.querySelectorAll(
            "[data-sho1re1-hidden]"
        );


    hidden.forEach(
        function(element) {

            element.style.display =
                element.getAttribute(
                    "data-sho1re1-original-display"
                ) || "";


            element.removeAttribute(
                "data-sho1re1-hidden"
            );


            element.removeAttribute(
                "data-sho1re1-original-display"
            );

        }
    );


    /*
       Remove old exit button.
    */

    const oldExit =
        document.getElementById(
            "Sho1re1ExitButton"
        );


    if (oldExit) {

        oldExit.remove();

    }

}


/* ============================================================
   SAVE ORIGINAL PAGE STATE
============================================================ */

let Sho1re1UniversalOriginalState = [];


function Sho1re1UniversalSavePage() {

    Sho1re1UniversalOriginalState = [];


    Array.from(
        document.body.children
    ).forEach(
        function(element) {

            /*
               Save only actual body children.
            */

            Sho1re1UniversalOriginalState.push({

                element:
                    element,

                display:
                    element.style.display,

                visibility:
                    element.style.visibility,

                position:
                    element.style.position

            });

        }
    );

}


/* ============================================================
   HIDE ORIGINAL PAGE
============================================================ */

function Sho1re1UniversalHidePage() {

    Sho1re1UniversalOriginalState
        .forEach(
            function(item) {

                /*
                   Don't hide overlay if it somehow
                   already exists.
                */

                if (
                    item.element.id ===
                    SHO1RE1_UNIVERSAL.overlayId
                ) {

                    return;

                }


                item.element.style.display =
                    "none";

            }
        );


    /*
       Prevent scrolling on original page.
    */

    document.documentElement.style.overflow =
        "hidden";


    document.body.style.overflow =
        "hidden";


    document.body.style.margin =
        "0";

}


/* ============================================================
   RESTORE ORIGINAL PAGE
============================================================ */

function Sho1re1UniversalRestorePage() {

    Sho1re1UniversalOriginalState
        .forEach(
            function(item) {

                if (
                    !item.element ||
                    !item.element.isConnected
                ) {

                    return;

                }


                item.element.style.display =
                    item.display;


                item.element.style.visibility =
                    item.visibility;


                item.element.style.position =
                    item.position;

            }
        );


    document.documentElement.style.overflow =
        "";


    document.body.style.overflow =
        "";


    document.body.style.margin =
        "";

}


/* ============================================================
   CREATE SHARED OVERLAY
============================================================ */

function Sho1re1UniversalCreateOverlay(
    card,
    post
) {

    /*
       Remove previous overlay.
    */

    const old =
        document.getElementById(
            SHO1RE1_UNIVERSAL.overlayId
        );


    if (old) {

        old.remove();

    }


    /*
       Overlay
    */

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        SHO1RE1_UNIVERSAL.overlayId;


    /*
       FULL SCREEN
    */

    Object.assign(
        overlay.style,
        {

            position: "fixed",

            inset: "0",

            width: "100vw",

            height: "100vh",

            minHeight: "100dvh",

            zIndex: "99999999",

            background: "#000",

            overflowY: "auto",

            overflowX: "hidden",

            boxSizing: "border-box",

            display: "flex",

            flexDirection: "column",

            alignItems: "center",

            margin: "0",

            padding: "0"

        }
    );


    /*
       Shared view content wrapper
    */

    const content =
        document.createElement(
            "div"
        );


    content.style.width =
        "100%";


    content.style.minHeight =
        "100%";


    content.style.boxSizing =
        "border-box";


    content.style.display =
        "flex";


    content.style.flexDirection =
        "column";


    content.style.alignItems =
        "center";


    content.style.padding =
        "16px";


    content.style.paddingTop =
        "76px";


    content.style.paddingBottom =
        "30px";


    /*
       Exit button
    */

    const exit =
        document.createElement(
            "button"
        );


    exit.id =
        SHO1RE1_UNIVERSAL.exitButtonId;


    exit.type =
        "button";


    exit.innerHTML =
        "← View all posts";


    Object.assign(
        exit.style,
        {

            position: "fixed",

            top: "14px",

            left: "14px",

            zIndex: "100000001",

            padding: "11px 17px",

            border: "1px solid rgba(255,255,255,.15)",

            borderRadius: "999px",

            background: "rgba(20,20,20,.9)",

            color: "#fff",

            fontSize: "14px",

            fontWeight: "700",

            cursor: "pointer",

            backdropFilter: "blur(12px)",

            webkitBackdropFilter: "blur(12px)",

            boxShadow:
                "0 6px 25px rgba(0,0,0,.35)"

        }

    );


    exit.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            Sho1re1UniversalExit();

        }
    );


    /*
       Post title
    */

    if (
        post &&
        post.title
    ) {

        const title =
            document.createElement(
                "div"
            );


                title.textContent =
            post.title;

        title.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            color: white;
            font-size: 22px;
            font-weight: 700;
            z-index: 10;
        `;

        overlay.appendChild(title);
    }

    /*
       Add selected post card
    */

    if (card) {

        const cardClone =
            card.cloneNode(true);

        cardClone.style.cssText = `
            position: relative;
            width: min(92vw, 420px);
            height: min(70vh, 650px);
            margin: auto;
            flex-shrink: 0;
            z-index: 5;
        `;

        overlayContent.appendChild(
            cardClone
        );
    }


    /*
       Add overlay to page
    */

    overlay.appendChild(
        overlayContent
    );

    document.body.appendChild(
        overlay
    );


    /*
       Exit shared post
    */

    exitButton.addEventListener(
        "click",
        () => {

            history.pushState(
                {},
                "",
                window.location.pathname
            );

            overlay.remove();

            document.body.style.overflow =
                originalOverflow;

        }
    );


    /*
       Back button support
    */

    window.addEventListener(
        "popstate",
        () => {

            if (overlay) {
                overlay.remove();
            }

            document.body.style.overflow =
                originalOverflow;

        }
    );

})();
      
