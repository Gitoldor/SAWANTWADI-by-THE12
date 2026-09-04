(function () {

    "use strict";

    /* ============================================================
       UNIVERSAL POST SHARING SYSTEM
       ============================================================ */

    var SHARE_BUTTON_CLASS =
        "Sho1re1UniversalShareButton";

    var OVERLAY_ID =
        "Sho1re1UniversalOverlay";

    var EXIT_BUTTON_ID =
        "Sho1re1UniversalExitButton";

    var originalBodyOverflow = "";

    var pageStateSaved = false;


    /* ============================================================
       GET POSTS
       ============================================================ */

    function getPosts() {

        var posts =
            window.Sho1re1VisiblePlaces;

        if (
            Array.isArray(posts) &&
            posts.length
        ) {
            return posts;
        }


        posts =
            window.Sho1re1Places;

        if (
            Array.isArray(posts) &&
            posts.length
        ) {
            return posts;
        }


        return [];
    }


    /* ============================================================
       GET POST ID FROM URL
       ============================================================ */

    function getSharedPostID() {

        var params =
            new URLSearchParams(
                window.location.search
            );

        return params.get("post");
    }


    /* ============================================================
       FIND POST BY ID
       ============================================================ */

    function findPost(id) {

        if (
            id === null ||
            id === undefined ||
            id === ""
        ) {
            return null;
        }


        var posts =
            getPosts();


        for (
            var i = 0;
            i < posts.length;
            i++
        ) {

            if (
                String(posts[i].id) ===
                String(id)
            ) {

                return posts[i];

            }

        }


        return null;
    }


    /* ============================================================
       CREATE POST URL
       ============================================================ */

    function getPostURL(post) {

        if (!post) {
            return window.location.href;
        }


        var url =
            new URL(
                window.location.href
            );


        /*
           Remove every existing query parameter.
        */

        url.search = "";


        /*
           Add only the post ID.
        */

        url.searchParams.set(
            "post",
            String(post.id)
        );


        return url.toString();
    }


    /* ============================================================
       COPY TEXT
       ============================================================ */

    function copyText(text) {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            return navigator.clipboard.writeText(
                text
            );

        }


        return new Promise(
            function (resolve, reject) {

                var input =
                    document.createElement(
                        "input"
                    );


                input.value =
                    text;


                input.style.position =
                    "fixed";

                input.style.left =
                    "-9999px";


                document.body.appendChild(
                    input
                );


                input.focus();

                input.select();


                try {

                    document.execCommand(
                        "copy"
                    );

                    input.remove();

                    resolve();

                }
                catch (error) {

                    input.remove();

                    reject(error);

                }

            }
        );
    }


    /* ============================================================
       TOAST
       ============================================================ */

    function showToast(message) {

        var oldToast =
            document.getElementById(
                "Sho1re1UniversalToast"
            );


        if (oldToast) {
            oldToast.remove();
        }


        var toast =
            document.createElement(
                "div"
            );


        toast.id =
            "Sho1re1UniversalToast";


        toast.textContent =
            message;


        toast.style.cssText = `
            position: fixed;
            left: 50%;
            bottom: 25px;
            transform: translateX(-50%);
            z-index: 9999999;
            padding: 12px 18px;
            border-radius: 999px;
            background: rgba(20,20,20,.95);
            color: white;
            font-size: 14px;
            font-family: inherit;
            box-shadow: 0 8px 30px rgba(0,0,0,.35);
            white-space: nowrap;
        `;


        document.body.appendChild(
            toast
        );


        setTimeout(
            function () {

                if (toast) {
                    toast.remove();
                }

            },
            2200
        );

    }


    /* ============================================================
       SHARE POST
       ============================================================ */

    async function sharePost(post) {

        if (!post) {
            return;
        }


        var url =
            getPostURL(post);


        /*
           Android / browser native share
        */

        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title:
                        post.title ||
                        "Post",

                    text:
                        post.title ||
                        "",

                    url:
                        url

                });


                return;

            }
            catch (error) {

                /*
                   User pressed Cancel.
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

            await copyText(
                url
            );

            showToast(
                "Post link copied"
            );

        }
        catch (error) {

            window.prompt(
                "Copy this post link:",
                url
            );

        }

    }


    /* ============================================================
       SHARE ICON SVG
       ============================================================ */

    function getShareSVG() {

        return `
            <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle
                    cx="18"
                    cy="5"
                    r="3"
                ></circle>

                <circle
                    cx="6"
                    cy="12"
                    r="3"
                ></circle>

                <circle
                    cx="18"
                    cy="19"
                    r="3"
                ></circle>

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

    }


    /* ============================================================
       CREATE SHARE BUTTON
       ============================================================ */

    function createShareButton(post) {

        var button =
            document.createElement(
                "button"
            );


        button.className =
            SHARE_BUTTON_CLASS;


        button.type =
            "button";


        button.setAttribute(
            "aria-label",
            "Share post"
        );


        button.setAttribute(
            "title",
            "Share post"
        );


        button.innerHTML =
            getShareSVG();


        button.style.cssText = `
            position: absolute;
            right: 15px;
            bottom: 15px;

            width: 46px;
            height: 46px;

            min-width: 46px;
            min-height: 46px;

            padding: 0;
            margin: 0;

            border: 0;
            outline: none;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: rgba(0,0,0,.72);
            color: #fff;

            cursor: pointer;

            z-index: 99999;

            box-shadow:
                0 5px 20px rgba(0,0,0,.35);

            backdrop-filter:
                blur(10px);

            -webkit-backdrop-filter:
                blur(10px);

            touch-action: manipulation;
        `;


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                sharePost(
                    post
                );

            },
            true
        );


        /*
           Prevent card click from
           triggering underneath it.
        */

        button.addEventListener(
            "pointerdown",
            function (event) {

                event.stopPropagation();

            },
            true
        );


        return button;
    }


    /* ============================================================
       REMOVE OLD APP.JS SHARE BUTTONS
       ============================================================ */

    function removeOldShareButtons() {

        var oldButtons =
            document.querySelectorAll(
                ".Sho1re1AutoShareButton"
            );


        for (
            var i = 0;
            i < oldButtons.length;
            i++
        ) {

            oldButtons[i].remove();

        }

    }


    /* ============================================================
       GET CARDS
       ============================================================ */

    function getCards() {

        var carousel =
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
       ADD SHARE BUTTONS
       ============================================================ */

    function addShareButtons() {

        removeOldShareButtons();


        var cards =
            getCards();


        if (!cards.length) {
            return;
        }


        var posts =
            getPosts();


        /*
           Cards are generated from
           the active/visible post array.
        */

        for (
            var i = 0;
            i < cards.length;
            i++
        ) {

            var card =
                cards[i];


            var post =
                posts[i];


            if (!post) {
                continue;
            }


            /*
               Prevent duplicate Universal buttons.
            */

            var existing =
                card.querySelector(
                    "." +
                    SHARE_BUTTON_CLASS
                );


            if (existing) {

                /*
                   Make sure ID is still correct.
                */

                card.dataset.sho1re1PostId =
                    String(post.id);

                continue;

            }


            /*
               Cards need relative positioning
               so the button can sit inside them.
            */

            var computed =
                window.getComputedStyle(
                    card
                );


            if (
                computed.position ===
                "static"
            ) {

                card.style.position =
                    "relative";

            }


            /*
               Store the post ID directly
               on the card.
            */

            card.dataset.sho1re1PostId =
                String(post.id);


            /*
               Create button.
            */

            var shareButton =
                createShareButton(
                    post
                );


            card.appendChild(
                shareButton
            );

        }

    }


    /* ============================================================
       FIND CARD FOR POST
       ============================================================ */

    function findCardForPost(post) {

        if (!post) {
            return null;
        }


        var cards =
            getCards();


        /*
           First try exact data ID.
        */

        for (
            var i = 0;
            i < cards.length;
            i++
        ) {

            if (
                String(
                    cards[i].dataset.sho1re1PostId
                ) ===
                String(post.id)
            ) {

                return cards[i];

            }

        }


        /*
           Fallback: use post index.
        */

        var posts =
            getPosts();


        for (
            var j = 0;
            j < posts.length;
            j++
        ) {

            if (
                String(posts[j].id) ===
                String(post.id)
            ) {

                return cards[j] ||
                    null;

            }

        }


        return null;

    }


    /* ============================================================
       SAVE ORIGINAL PAGE STATE
       ============================================================ */

    function savePageState() {

        if (pageStateSaved) {
            return;
        }


        originalBodyOverflow =
            document.body.style.overflow;


        pageStateSaved =
            true;

    }


    /* ============================================================
       REMOVE OLD SHARED MODE
       ============================================================ */

    function removeOldSharedMode() {

        /*
           Remove old app.js exit button.
        */

        var oldExit =
            document.getElementById(
                "Sho1re1ExitButton"
            );


        if (oldExit) {
            oldExit.remove();
        }


        /*
           Remove old hidden attributes.
        */

        var hidden =
            document.querySelectorAll(
                "[data-sho1re1-hidden]"
            );


        for (
            var i = 0;
            i < hidden.length;
            i++
        ) {

            var element =
                hidden[i];


            var originalDisplay =
                element.getAttribute(
                    "data-sho1re1-original-display"
                );


            element.style.display =
                originalDisplay || "";


            element.removeAttribute(
                "data-sho1re1-hidden"
            );


            element.removeAttribute(
                "data-sho1re1-original-display"
            );

        }

    }


    /* ============================================================
       CREATE SHARED OVERLAY
       ============================================================ */

    function createOverlay(post, card) {

        /*
           Remove existing Universal overlay.
        */

        var oldOverlay =
            document.getElementById(
                OVERLAY_ID
            );


        if (oldOverlay) {
            oldOverlay.remove();
        }


        savePageState();


        removeOldSharedMode();


        /*
           Hide the original page completely.
        */

        document.body.style.overflow =
            "hidden";


        var overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            OVERLAY_ID;


        overlay.style.cssText = `
            position: fixed;
            inset: 0;

            width: 100vw;
            height: 100dvh;

            background: #000;

            z-index: 999999;

            overflow: hidden;

            display: flex;
            flex-direction: column;

            box-sizing: border-box;

            font-family: inherit;
        `;


        /*
           Top bar
        */

        var topBar =
            document.createElement(
                "div"
            );


        topBar.style.cssText = `
            position: relative;

            width: 100%;

            height: 70px;

            min-height: 70px;

            display: flex;

            align-items: center;

            padding: 10px 15px;

            box-sizing: border-box;

            z-index: 20;
        `;


        /*
           Exit button
        */

        var exitButton =
            document.createElement(
                "button"
            );


        exitButton.id =
            EXIT_BUTTON_ID;


        exitButton.type =
            "button";


        exitButton.innerHTML =
            "← View all posts";


        exitButton.style.cssText = `
            border: 0;

            border-radius: 999px;

            padding: 11px 16px;

            background:
                rgba(255,255,255,.12);

            color: white;

            font-size: 14px;

            font-weight: 600;

            cursor: pointer;

            backdrop-filter:
                blur(10px);

            -webkit-backdrop-filter:
                blur(10px);
        `;


        exitButton.addEventListener(
            "click",
            function () {

                exitSharedPost(
                    true
                );

            }
        );


        topBar.appendChild(
            exitButton
        );


        overlay.appendChild(
            topBar
        );


        /*
           Content area
        */

        var content =
            document.createElement(
                "div"
            );


        content.style.cssText = `
            position: relative;

            flex: 1;

            width: 100%;

            min-height: 0;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            gap: 12px;

            padding:
                0 16px 25px;

            box-sizing: border-box;

            overflow: hidden;
        `;


        /*
           Post title
        */

        if (
            post &&
            post.title
        ) {

            var title =
                document.createElement(
                    "div"
                );


            title.textContent =
                post.title;


            title.style.cssText = `
                width: 100%;

                max-width: 500px;

                color: white;

                font-size: 20px;

                line-height: 1.3;

                font-weight: 700;

                text-align: left;

                flex-shrink: 0;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;

                box-sizing: border-box;
            `;


            content.appendChild(
                title
            );

        }


        /*
           Clone original card.
        */

        if (card) {

            var clone =
                card.cloneNode(
                    true
                );


            /*
               Remove old share buttons
               from clone.
            */

            var oldCloneButtons =
                clone.querySelectorAll(
                    ".Sho1re1UniversalShareButton, .Sho1re1AutoShareButton"
                );


            for (
                var i = 0;
                i < oldCloneButtons.length;
                i++
            ) {

                oldCloneButtons[i].remove();

            }


            clone.style.cssText = `
                position: relative;

                width: min(92vw, 430px);

                height: min(68vh, 650px);

                max-height: 650px;

                flex-shrink: 1;

                margin: 0;

                box-sizing: border-box;
            `;


            content.appendChild(
                clone
            );


            /*
               Add share button to
               shared card too.
            */

            var cloneShare =
                createShareButton(
                    post
                );


            cloneShare.style.right =
                "15px";


            cloneShare.style.bottom =
                "15px";


            clone.appendChild(
                cloneShare
            );

        }


        overlay.appendChild(
            content
        );


        document.body.appendChild(
            overlay
        );


        return overlay;

    }
       /* ============================================================
       EXIT SHARED POST
       ============================================================ */

    function exitSharedPost(updateURL) {

        var overlay =
            document.getElementById(
                OVERLAY_ID
            );


        if (overlay) {
            overlay.remove();
        }


        /*
           Restore body.
        */

        document.body.style.overflow =
            originalBodyOverflow;


        /*
           Remove Universal exit button
           if it somehow remains.
        */

        var exitButton =
            document.getElementById(
                EXIT_BUTTON_ID
            );


        if (exitButton) {
            exitButton.remove();
        }


        /*
           Remove old app.js shared mode.
        */

        removeOldSharedMode();


        /*
           Remove post parameter.
        */

        if (updateURL) {

            var url =
                new URL(
                    window.location.href
                );


            url.searchParams.delete(
                "post"
            );


            history.pushState(
                {},
                "",
                url.pathname +
                url.search +
                url.hash
            );

        }


        /*
           Allow the normal app to
           render everything again.
        */

        pageStateSaved =
            false;


        /*
           Re-add share buttons.
        */

        setTimeout(
            function () {

                addShareButtons();

            },
            100
        );

    }


    /* ============================================================
       OPEN SHARED POST
       ============================================================ */

    function openSharedPost() {

        var id =
            getSharedPostID();


        /*
           No ?post=ID
        */

        if (!id) {

            addShareButtons();

            return;

        }


        /*
           Find actual post.
        */

        var post =
            findPost(
                id
            );


        /*
           Posts may not have been
           loaded yet.
        */

        if (!post) {
            return;
        }


        /*
           Make sure buttons/data IDs
           have been applied first.
        */

        addShareButtons();


        /*
           Find corresponding card.
        */

        var card =
            findCardForPost(
                post
            );


        /*
           Card may not have rendered yet.
        */

        if (!card) {
            return;
        }


        /*
           Open full shared mode.
        */

        createOverlay(
            post,
            card
        );

    }


    /* ============================================================
       MUTATION OBSERVER
       ============================================================ */

    var observer = null;


    function startObserver() {

        if (observer) {
            return;
        }


        observer =
            new MutationObserver(
                function () {

                    /*
                       Cards can be destroyed
                       and recreated by app.js.
                    */

                    addShareButtons();


                    /*
                       If URL contains
                       ?post=ID, keep trying
                       until card exists.
                    */

                    if (
                        getSharedPostID()
                    ) {

                        var existing =
                            document.getElementById(
                                OVERLAY_ID
                            );


                        if (!existing) {

                            openSharedPost();

                        }

                    }

                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    var scanCount = 0;


    function initialize() {

        startObserver();


        /*
           Remove the old app.js
           sharing UI.
        */

        removeOldShareButtons();


        /*
           Try immediately.
        */

        addShareButtons();


        /*
           Try opening shared post.
        */

        openSharedPost();


        /*
           Re-scan because the map app
           renders asynchronously.
        */

        var scanner =
            setInterval(
                function () {

                    scanCount++;


                    addShareButtons();


                    if (
                        getSharedPostID()
                    ) {

                        var overlay =
                            document.getElementById(
                                OVERLAY_ID
                            );


                        if (!overlay) {

                            openSharedPost();

                        }

                    }


                    /*
                       Stop after 30 seconds.
                    */

                    if (
                        scanCount >= 60
                    ) {

                        clearInterval(
                            scanner
                        );

                    }

                },
                500
            );

    }


    /* ============================================================
       BROWSER BACK / FORWARD
       ============================================================ */

    window.addEventListener(
        "popstate",
        function () {

            var id =
                getSharedPostID();


            if (!id) {

                exitSharedPost(
                    false
                );

                return;

            }


            /*
               New shared post URL.
            */

            var overlay =
                document.getElementById(
                    OVERLAY_ID
                );


            if (overlay) {
                overlay.remove();
            }


            pageStateSaved =
                false;


            openSharedPost();

        }
    );


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.Sho1re1Universal = {

        sharePost:
            sharePost,

        addShareButtons:
            addShareButtons,

        openSharedPost:
            openSharedPost,

        exitSharedPost:
            function () {

                exitSharedPost(
                    true
                );

            }

    };


    /* ============================================================
       START
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    }
    else {

        initialize();

    }


})();
