var thisPageViewed = 0;

function initPageViewed() {
    pageViewedButton = document.getElementById("pageviewed-count");
    if (pageViewedButton) {
        getThisPageViewed(success = function (data) {
            thisPageViewed = data.count;
            pageViewedButton.textContent = thisPageViewed;
        })

    }
}

function addEventListeners() {
    document.addEventListener("DOMContentLoaded", function () {
        initPageViewed();

        document.getElementById("delete-btn").addEventListener("click", function () {
            console.log("delete");
            if (!askForAccess()) return;
            deleteArticle();
        });

        document.getElementById("share-button").addEventListener("click", function () {
            console.log("share");
            const link = window.location.href;
            copyText(link);
        });

        document.getElementById("copy-link-button").addEventListener("click", function () {
            console.log("copy link");
            const link = document.querySelector(".data-container").getAttribute("data-link");
            copyText(link);
        });

        document.getElementById("go-button").addEventListener("click", function () {
            console.log("go");
            const link = document.querySelector(".data-container").getAttribute("data-link");
            window.open(link, '_blank');
        });

        document.getElementById("new-comment-submit").addEventListener("click", function () {
            console.log("new comment submit");
            OnPostCommentButtonClick();
        });

        document.getElementById("new-comment-submit-reply").addEventListener("click", function () {
            console.log("new comment submit reply");
            OnPostReplyCommentButtonClick(window._comment_reply_to);
        });

        document.getElementById("edit-btn").addEventListener("click", function () {
            console.log("edit");
            if (!askForAccess()) return;
            enterEdit();
        });

        document.getElementById("theme-btn").addEventListener("click", function () {
            SwitchTheme();
        });

    });

    addSidebarListeners();
    addFillSidebarListener();

}

function enterEdit() {
    if (this._is_edit_mode) {
        saveChanges(suc = function (data) {
            this._is_edit_mode = false;
            // remove on-edit class from title description and image
            const title_dom = document.querySelector('#post-title')
            const desc_dom = document.querySelector('#post-description')
            const img_dom = document.querySelector('.image-container')
            title_dom.removeAttribute('contenteditable')
            title_dom.classList.remove('on-edit')
            desc_dom.removeAttribute('contenteditable')
            desc_dom.classList.remove('on-edit')
            // remove edit overlay from image dom
            const edit_overlay = img_dom.querySelector('.edit-overlay')
            img_dom.removeChild(edit_overlay)
            // remove comment overlay from comment dom
            const comments = document.querySelectorAll('.article-comment')
            comments.forEach(function (comment) {
                const overlay = comment.querySelector('.comment-overlay')
                comment.removeChild(overlay)
            });
            // notify
            window.Ntf.add("Changes saved", {
                type: "success",
                onRemove: function () {
                    window.location.reload();
                },
            });
            return;
        }, err = function (data) {
            window.Ntf.error("Failed to save changes");
            return;
        });
        return;
    }
    this._is_edit_mode = true;
    console.log("enter edit");
    // add on-edit class to title description and image
    const title_dom = document.querySelector('#post-title')
    const desc_dom = document.querySelector('#post-description')
    const img_dom = document.querySelector('.image-container')
    // add edit overlay to image dom
    const edit_overlay = document.createElement('div')
    edit_overlay.classList.add('edit-overlay')
    // add edit button to title and description
    const edit_btn = document.createElement('button')
    edit_btn.classList.add('edit-btn', 'edit-overlag-button')
    const edit_icon = document.createElement('i')
    edit_icon.classList.add('fa', 'fa-edit')
    edit_btn.appendChild(edit_icon)
    edit_overlay.appendChild(edit_btn)
    img_dom.appendChild(edit_overlay)
    // add edit overlay to comment dom
    const comment_overlay = document.createElement('div')
    comment_overlay.classList.add('comment-overlay')
    // add delete button to comment overlay
    const delete_btn = document.createElement('button')
    delete_btn.classList.add('delete-btn', 'comment-overlay-button')
    const delete_icon = document.createElement('i')
    delete_icon.classList.add('fa', 'fa-trash')
    delete_btn.appendChild(delete_icon)
    comment_overlay.appendChild(delete_btn)
    // select all comments and append comment overlay
    const comments = document.querySelectorAll('.article-comment')
    comments.forEach(function (comment) {
        const cloneNode = comment_overlay.cloneNode(true);
        // add event listener to delete button
        const delete_btn = cloneNode.querySelector('.delete-btn')
        delete_btn.addEventListener('click', function () {
            console.log("delete comment");
            deleteComment(comment.getAttribute('comment-id'));
        });
        comment.appendChild(cloneNode)
    })
    // add contenteditable attribute and on-edit class to title and description
    title_dom.setAttribute('contenteditable', true)
    title_dom.classList.add('on-edit')
    desc_dom.setAttribute('contenteditable', true)
    desc_dom.classList.add('on-edit')
    // add event listeners to edit button
    edit_btn.addEventListener('click', function () {
        // get new url link
        const new_link = window.prompt("Enter new link", img_dom.querySelector('img').getAttribute('src'));
        if (new_link) {
            // update image src
            img_dom.querySelector('img').setAttribute('src', new_link);

        }
    });

}

function saveChanges(suc, err) {
    console.log("saving...");
    const title = document.querySelector('#post-title').textContent;
    const desc = document.querySelector('#post-description').textContent;
    const img = document.querySelector('.image-container img').getAttribute('src');
    const article_id = window.location.pathname.split("/")[2];
    const link = document.querySelector(".data-container").getAttribute("data-link");
    // build article
    article = buildArticle(title, desc, img, link);
    liteblogApis.editArticle({
        article_id: article_id,
        title: title,
        content: "none",
        content_html: article,
        extra_flags: {
            "language_code": "en",
            "article_description": desc,
        },
        author: "system",
    }, success = function (data) {
        console.log("Changes saved");
        suc(data)
    }, error = function (data) {
        console.log("Failed to save changes", data);
        err(data)
    });
}

function deleteArticle() {
    if (!confirm("Are you sure you want to delete this article?")) return;
    articleId = window.location.pathname.split("/")[2];
    liteblogApis.deleteArticle(articleId, function (data) {
        console.log("Article deleted");
        window.Ntf.add("Article deleted", {
            type: "success",
            onRemove: function () {
                window.location.href = "/";
            },
        })
    }, function (data) {
        console.log("Failed to delete article", data);
        window.Ntf.add("Failed to delete article", {
            type: "error",
        })

    });
}

function addSidebarListeners() {
    document.addEventListener('DOMContentLoaded', function () {
        const toggleSidebar = document.getElementById('toggleSidebar');
        const sidebar = document.querySelector('.index-sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        // Toggle sidebar on desktop
        toggleSidebar.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed'); // toggle collapsed class
            // set sidebar width to 70px on desktop
            if (sidebar.classList.contains('collapsed')) {
                document.body.style.setProperty('--sidebar-width', "70px")
            } else {
                document.body.style.setProperty('--sidebar-width', "240px")
            }
        });

        // Toggle sidebar on mobile
        mobileMenuBtn.addEventListener('click', function () {
            sidebar.classList.toggle('expanded');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function (event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMobileMenu = mobileMenuBtn.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnMobileMenu && sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                }
            }
        });
    });
}

function addFillSidebarListener() {
    document.addEventListener('DOMContentLoaded', function () {
        const sidebar = document.querySelector('.index-sidebar >.sidebar-menu');
        const classes = document.querySelectorAll('.card-container.card-container-split-line');
        classes.forEach(function (element) {
            // add classfications to sidebar items
            domparser = new DOMParser();
            el = domparser.parseFromString(sidebarItemHTML, "text/html").body.firstChild;
            sidebar.appendChild(el);
            tag = el.querySelector('.menu-text');
            tag.textContent = element.querySelector('.card-title').textContent;
            // add click event listener to sidebar items
            el.addEventListener('click', function (e) {
                e.preventDefault();
                // scroll to clicked class
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    });
}

function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
            console.log("Copied to clipboard:" + text);
            window.Ntf.add("Copied to clipboard!", {
                type: "success",
            });
        }, function (err) {
            console.error("Failed to copy to clipboard: " + err);
            window.Ntf.error("Failed to copy to clipboard");
        });
    } else {
        // try fallback method
        const input = document.createElement("input");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        console.log("Copied to clipboard!" + text);
        window.Ntf.add("Copied to clipboard!", {
            type: "success",
        });
    }
}

function OnReplyButtonClick(replyId) {
    console.log("reply to " + replyId);
    // set window reply to
    window._comment_reply_to = replyId;
    // show reply button
    btn = document.getElementById("new-comment-submit-reply");
    btn.style.display = "";
    // scroll to reply form
    document.querySelector(".new-comment-container").scrollIntoView({ behavior: "smooth", block: "start" });
}

function OnPostCommentButtonClick() {
    console.log("post comment");
    CommentVerify(success = function (token) {
        AddComment(token, "");
    });
}

function OnPostReplyCommentButtonClick(commentId) {
    console.log("post reply to " + commentId);
    CommentVerify(success = function (token) {
        AddComment(token, commentId);
    });
}

var CF_Site_key = "{{global:cf_site_key}}"
var Goole_reCaptcha_Site_key = "{{global:google_site_key}}"
var comment_check_type = "{{global:comment_check_type}}"

function CommentVerify(success) {
    verifyDom = document.getElementById("new-comment-verify-container");
    if (!verifyDom || comment_check_type == "") {
        console.log("Comment system has been disabled!");
        window.Ntf.error("Comment system has been disabled!");
        return;
    }
    verifyDom.style.display = "";
    switch (comment_check_type) {
        case "google_recaptcha":
            // load google recaptcha
            const recaptcha_script = document.createElement("script");
            recaptcha_script.src = "https://www.google.com/recaptcha/api.js?render=" + Goole_reCaptcha_Site_key;
            // add loaded event listener
            recaptcha_script.addEventListener("load", function () {
                grecaptcha.ready(function () {
                    grecaptcha.execute(Goole_reCaptcha_Site_key, { action: "submit" }).then(function (token) {
                        console.log("recaptcha token: " + token);
                        setTimeout(function () {
                            verifyDom.style.display = "none";
                            verifyDom.innerHTML = ""; // remove turnstile widget
                        }, 1000);
                        success(token);
                    });
                });
            });

            document.body.appendChild(recaptcha_script);
            break;
        case "cloudflare_turnstile":
            // change verify dom class to inner-cf-turnstile and set data-sitekey attribute
            verifyDom.classList.add("inner-cf-turnstile");
            verifyDom.setAttribute("data-sitekey", CF_Site_key);
            // load cloudflare turnstile
            const turnstile_script = document.createElement("script");
            turnstile_script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
            // add loaded event listener
            window.onloadTurnstileCallback = function () {
                turnstile.render(".inner-cf-turnstile", {
                    sitekey: CF_Site_key,
                    callback: function (token) {
                        console.log(`Challenge Success ${token}`);
                        setTimeout(function () {
                            verifyDom.style.display = "none";
                            verifyDom.innerHTML = ""; // remove turnstile widget
                        }, 1000);
                        success(token);
                    },
                });
            };

            document.body.appendChild(turnstile_script);
            break;
    }
}

function AddComment(token, replyto) {
    content = document.getElementById("new-comment-content").value;
    author = document.getElementById("new-comment-author-name").value;
    email = document.getElementById("new-comment-author-email").value;
    if (!isAvailableEmailAddress(email)) {
        window.Ntf.error("Invalid email address");
        return;
    }
    liteblogApis.addComment(
        verify_token = token,
        article_id = window.location.pathname.split("/")[2],
        content = content,
        author = author,
        email = email,
        reply_to = replyto,
        subscribed = false,
        success = function (data) {
            console.log("Comment added");
            window.Ntf.add("Comment added", {
                type: "success",
                onRemove: function () {
                    window.location.reload();
                },
            });
        },
        error = function (data) {
            console.log("Failed to add comment", data);
            window.Ntf.error("Failed to add comment");
        }
    )
}

function isAvailableEmailAddress(email) {
    // 基础检查：非字符串、空值、无@符号直接返回false
    if (typeof email !== 'string' || !email) return false;
    if (email.indexOf('@') === -1) return false;

    // 分割本地部分和域名部分
    const parts = email.split('@');
    const localPart = parts[0];
    const domainPart = parts[1];

    // 检查分割结果有效性
    if (parts.length !== 2 || !localPart || !domainPart) return false;

    // 1. 本地部分验证
    const localRegex = /^[a-zA-Z0-9!#$%&'*+\-\/=?^_`{|}~]+(\.[a-zA-Z0-9!#$%&'*+\-\/=?^_`{|}~]+)*$/;
    if (
        // 长度检查 (1-64字符)
        localPart.length < 1 || localPart.length > 64 ||
        // 开头/结尾不能是点
        localPart.startsWith('.') || localPart.endsWith('.') ||
        // 连续点检查
        localPart.includes('..') ||
        // 字符有效性
        !localRegex.test(localPart)
    ) {
        return false;
    }

    // 2. 域名部分验证
    if (
        // 长度检查 (1-255字符)
        domainPart.length < 1 || domainPart.length > 255 ||
        // 开头/结尾不能是连字符或点
        domainPart.startsWith('-') || domainPart.endsWith('-') ||
        domainPart.startsWith('.') || domainPart.endsWith('.') ||
        // 连续点检查
        domainPart.includes('..')
    ) {
        return false;
    }

    // 域名标签分割验证
    const domainLabels = domainPart.split('.');
    const labelRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;

    for (const label of domainLabels) {
        if (
            // 标签长度检查 (1-63字符)
            label.length < 1 || label.length > 63 ||
            // 标签格式检查
            !labelRegex.test(label)
        ) {
            return false;
        }
    }

    // 顶级域名检查 (至少2个字母)
    const tld = domainLabels[domainLabels.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld)) {
        return false;
    }

    return true;
}

addEventListeners();