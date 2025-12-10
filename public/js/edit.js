const template_new_post = `{{file:template_new_post}}`
const index_edit_card_overlay = `
<div class="edit-overlay">
<div class="edit-overlay-button" id="show-card-button"><i class="fa fa-eye"></i></div>
<div class="edit-overlay-button" id="move-up-card-button"><i class="fa fa-caret-up"></i></div>
<div class="edit-overlay-button" id="move-down-card-button"><i class="fa fa-caret-down"></i></div>
<div class="edit-overlay-button" id="edit-card-button" data-i18n="edit">Edit <i class="fa fa-pencil"></i></div>
<div class="edit-overlay-button" id="delete-card-button" data-i18n="delete">Delete <i class="fa fa-trash"></i></div>
</div>
`
const template_add_card_input_form = `{{file:add_card_input_box}}`

function getThisPageViewed(success) {
    liteblogApis.getSnifferInfo(window.location.pathname, function (data) {
        success(data);
    }, function (data) {
        console.log(data);
    });
}

function enterEditMode() {
    if (window._is_in_edit_mode) {
        saveEditMode();
        window._is_in_edit_mode = false;
        document.querySelectorAll(".edit-overlay").forEach(function (overlay) {
            overlay.remove();
        });
        return;
    }
    window._is_in_edit_mode = true;
    domparser = new DOMParser();
    overlay_dom = domparser.parseFromString(index_edit_card_overlay, "text/html").body.firstChild;
    document.querySelectorAll(".card-container").forEach(function (card) {
        overlay = overlay_dom.cloneNode(true);
        overlay.style.borderRadius = window.getComputedStyle(card).borderRadius;
        overlay.querySelector("#edit-card-button").addEventListener("click", function () {
            editCard(card);
        });
        overlay.querySelector("#delete-card-button").addEventListener("click", function () {
            deleteCard(card);
        });
        card.appendChild(overlay);
        overlay.style.opacity = 0;
        overlay.offsetTop; // force reflow
        overlay.style.opacity = "";
    });
}

function editCard(card) {
    document.querySelectorAll(".card-input-box").forEach(function (box) {
        box.remove();
    });
    console.log("editCard", card);
    const card_id = card.getAttribute("card-id");
    window._edit_card_id = card_id;
    domparser = new DOMParser();
    liteblogApis.getCard(card_id, success = function (data) { //success
        console.log(data);

        input_form_dom = domparser.parseFromString(template_add_card_input_form, "text/html").body.firstChild;
        input_form_dom.setAttribute("mode", "edit");

        input_form_dom.querySelector("#add-card-title").value = data.card_title ? data.card_title : "";
        input_form_dom.querySelector("#add-card-description").value = data.card_description ? data.card_description : "";
        input_form_dom.querySelector("#add-card-link").value = data.card_link ? data.card_link : "";
        input_form_dom.querySelector("#add-card-image").value = data.card_image ? data.card_image : "";
        input_form_dom.querySelector("#add-card-template").value = data.card_template ? data.card_template : "";
        input_form_dom.querySelector("#add-card-order").value = data.order ? parseInt(data.order) : 1;
        input_form_dom.querySelector("#add-card-class-icon").value = data.icon ? data.icon : "";

        // disable detailed fields
        input_form_dom.querySelector("#add-card-detailed-title").parentNode.style.display = "none";
        input_form_dom.querySelector("#add-card-detailed-description").parentNode.style.display = "none";
        input_form_dom.querySelector("#add-card-detailed-image").parentNode.style.display = "none";
        input_form_dom.querySelector("#add-card-redirect-type").parentNode.style.display = "none";

        switch (data.template) {
            case 'card_template_classical':
                input_form_dom.querySelector("#add-card-template > option[value='card_template_classical']").selected = true;
                break;
            case 'card_template_split_line':
                input_form_dom.querySelector("#add-card-template > option[value='card_template_split_line']").selected = true;
                break;
            case 'card_template_search_bar':
                input_form_dom.querySelector("#add-card-template > option[value='card_template_search_bar']").selected = true;
                break;
        }

        // change btn text
        input_form_dom.querySelector(".add-card-button").textContent = "Save";
        input_form_dom.querySelector(".add-card-button").setAttribute("data-i18n", "save");

        document.body.appendChild(input_form_dom);
        addInputBoxSelectEventListeners();
    }, error = function (data) {
        console.log(data);
        window.Ntf.error("Failed to get card data.", {
            i18n: "failed-to-get-card-data",
        });
    })

}

function addInputBoxSelectEventListeners() {
    inputbox = document.querySelector(".card-input-box");
    redirectTypeSelect = inputbox.querySelector("#add-card-redirect-type");
    cardProxyGroups = document.querySelectorAll(".card-proxy-input-group");
    // add event listeners to select fields
    inputbox.querySelector('#add-card-redirect-type').addEventListener('change', function () {
        if (redirectTypeSelect.value == "proxy") {
            // show proxy fields
            cardProxyGroups.forEach(function (group) {
                group.parentNode.style.display = "";
            });
        } else {
            // hide proxy fields
            cardProxyGroups.forEach(function (group) {
                group.parentNode.style.display = "none";
            });
        }
    });
    inputbox.querySelector('#add-card-template').addEventListener('change', function () {
        newSelection = this.value;
        switch (newSelection) {
            case "card_template_classical":
                // hide split line fields
                inputbox.querySelector("#split-line-input-group").style.display = "none";
                if (inputbox.getAttribute("mode") != "edit") {
                    redirectTypeSelect.parentNode.style.display = "";
                }
                if (redirectTypeSelect.value == "proxy") {
                    // show proxy fields
                    cardProxyGroups.forEach(function (group) {
                        group.parentNode.style.display = "";
                    });
                } else {
                    // hide proxy fields
                    cardProxyGroups.forEach(function (group) {
                        group.parentNode.style.display = "none";
                    });
                }
                break;
            case "card_template_split_line":
                // show split line fields
                inputbox.querySelector("#split-line-input-group").style.display = "";
                redirectTypeSelect.parentNode.style.display = "none";
                // hide proxy fields
                cardProxyGroups.forEach(function (group) {
                    group.parentNode.style.display = "none";
                });
                break;
            case "card_template_search_bar":
                // hide all
                inputbox.querySelector("#split-line-input-group").style.display = "none";
                redirectTypeSelect.parentNode.style.display = "none";
                // hide proxy fields
                cardProxyGroups.forEach(function (group) {
                    group.parentNode.style.display = "none";
                });
                break;
        }
    });

    // call change event to set initial values
    inputbox.querySelector('#add-card-template').dispatchEvent(new Event('change'));
}

function addCard() {
    document.querySelectorAll(".card-input-box").forEach(function (box) {
        box.remove();
    });
    domparser = new DOMParser();
    input_form_dom = domparser.parseFromString(template_add_card_input_form, "text/html").body.firstChild;
    input_form_dom.setAttribute("mode", "add");
    document.body.appendChild(input_form_dom);
    addInputBoxSelectEventListeners();

}

function deleteCard(card) {
    const cardId = card.getAttribute("card-id");
    const cardInfoContainer = card.querySelector(".info-container");
    const cardRedirectType = cardInfoContainer?.getAttribute("data-redirect-type");
    console.log("deleteCard", cardId);
    if (!confirm(i18n.get_translation("confirm-to-delete-card", "Are you sure you want to delete this card?"))) return;
    if (cardRedirectType == "direct") {
        liteblogApis.deleteCard(cardId, success = function (data) {
            console.log(data);
            card.parentNode.removeChild(card);
            window.Ntf.success("Card deleted.", {
                i18n: "card-deleted",
            });
        }, error = function (data) {
            console.log(data);
        });
        return;
    }
    deleteArticle = false;
    if (card.classList.contains("card-classical")) {
        deleteArticle = confirm(i18n.get_translation("delete-article-as-well", "Do you want to delete the whole article as well?"));
    }
    if (deleteArticle) {
        // get card article id
        articleId = card.querySelector(".card-classical-link").getAttribute("href").split("/")[2];
        liteblogApis.deleteArticle(articleId, function (data) {
            console.log(data);
            window.Ntf.success("Article deleted.", {
                i18n: "article-deleted",
            });
        }, function (data) {
            console.log(data);
        });
    }
    liteblogApis.deleteCard(cardId, success = function (data) {
        console.log(data);
        card.parentNode.removeChild(card);
        window.Ntf.success("Card deleted.", {
            i18n: "card-deleted",
        });
    }, error = function (data) {
        console.log(data);
    })
}

function deleteComment(commentId) {
    if (!confirm(i18n.get_translation("confirm-to-delete-comment", "Are you sure you want to delete this comment?"))) return;
    liteblogApis.deleteComment(window.location.pathname.split("/")[2], commentId, success = function (data) {
        console.log(data);
        const comment_container = document.querySelector("#article-comment[comment-id='" + commentId + "']");
        comment_container.parentNode.removeChild(comment_container);
        window.Ntf.add("Comment deleted successfully!", {
            timeout: 3000,
            type: "success",
            i18n: "comment-deleted",
        });
    }, error = function (data) {
        console.log(data);
        window.Ntf.error("Failed to delete comment.", {
            i18n: "failed-to-delete-comment",
        });
    });
}

function saveEditMode() {
    console.log("saveEditMode");
    // get all cards
    const cards = [];
    document.querySelectorAll(".card-container").forEach(function (card) {
        const card_id = card.getAttribute("card-id");
        const order = card.style.order;
        cards.push({
            cardID: card_id,
            order: parseInt(order),
        })
    });
    console.log(cards);
    // send request to server
    liteblogApis.editOrder(cards, success = function (data) {
        console.log(data);
        window.Ntf.success("Order saved.", {
            i18n: "order-saved",
        });
    }, error = function (data) {
        console.log(data);
        window.Ntf.error("Failed to save order.", {
            i18n: "failed-to-save-order",
        });
    })
}

function OnAddCardButtonClick() {
    console.log("OnAddCardButtonClick");
    const mode = document.querySelector(".card-input-box").getAttribute("mode");
    const title = document.querySelector("#add-card-title").value;
    const description = document.querySelector("#add-card-description").value;
    const link = document.querySelector("#add-card-link").value;
    const image = document.querySelector("#add-card-image").value;
    const template = document.querySelector("#add-card-template").value;
    const redirect_type = document.querySelector("#add-card-redirect-type").value;
    const order = document.querySelector("#add-card-order").value;
    const icon = document.querySelector("#add-card-class-icon").value;
    const detailed_title = document.querySelector("#add-card-detailed-title").value == "" ? title : document.querySelector("#add-card-detailed-title").value;
    const detailed_description = document.querySelector("#add-card-detailed-description").value == "" ? description : document.querySelector("#add-card-detailed-description").value;
    const detailed_image = document.querySelector("#add-card-detailed-image").value == "" ? image : document.querySelector("#add-card-detailed-image").value;
    console.log(mode, title, description, link, image, template, order, detailed_title, detailed_description, detailed_image);
    if (mode == "add") {
        var article_id = "";
        if (template == 'card_template_classical') {
            if (redirect_type == "proxy") {
                // add new post
                // build post
                const new_post_html = buildArticle(redirect_type, detailed_title, detailed_description, detailed_image, link);
                console.log(new_post_html);
                liteblogApis.addArticle({
                    title: detailed_title,
                    content_html: new_post_html,
                    author: "system",
                    content: "none",
                    extra_flags: {
                        "language_code": "en",
                        "article_description": detailed_description,
                    }
                }, success = function (data) {
                    window.Ntf.success("Article created.", {
                        i18n: "article-created",
                    });
                    console.log(data);
                    article_id = data.article_id;

                    // add new card
                    liteblogApis.addCard({
                        card_title: title,
                        card_description: description,
                        card_link: "/articles/" + article_id,
                        card_image: image,
                        icon: icon,
                        order: String(order),
                        template: template,
                        redirect_type: redirect_type,
                    }, success = function (data) {
                        console.log(data);
                        CancelInputBox();
                        window.Ntf.add("Added Successfully!", {
                            timeout: 3000,
                            type: "success",
                            onRemove: function () {
                                window.location.reload();
                            },
                            i18n: "added-successfully",
                        })
                    }, error = function (data) {
                        console.log(data);
                        window.Ntf.error("Failed to add card.", {
                            i18n: "failed-to-add-card",
                        });
                    })

                }, error = function (data) {
                    console.log(data);
                    window.Ntf.error("Failed to create article.");
                })
            } else if (redirect_type == "direct") {
                liteblogApis.addCard({
                    card_title: title,
                    card_description: description,
                    card_link: "/redirect.html?name=" + title + "&url=" + btoa(link),
                    card_image: image,
                    icon: icon,
                    order: String(order),
                    template: template,
                    redirect_type: redirect_type,
                }, success = function (data) {
                    console.log(data);
                    CancelInputBox();
                    window.Ntf.add("Added Successfully!", {
                        timeout: 3000,
                        type: "success",
                        onRemove: function () {
                            window.location.reload();
                        },
                        i18n: "added-successfully",
                    })
                }, error = function (data) {
                    console.log(data);
                    window.Ntf.error("Failed to add card.", {
                        i18n: "failed-to-add-card",
                    });
                })
            }

        } else if (template == 'card_template_split_line') {
            liteblogApis.addCard({
                card_title: title,
                icon: icon,
                order: String(order),
                template: template,
            }, success = function (data) {
                console.log(data);
                CancelInputBox();
                window.Ntf.add("Added Successfully!", {
                    timeout: 3000,
                    type: "success",
                    onRemove: function () {
                        window.location.reload();
                    },
                    i18n: "added-successfully"
                })
            }, error = function (data) {
                console.log(data);
                window.Ntf.error("Failed to add card.", {
                    i18n: "failed-to-add-card",
                });
            })
        } else if (template == 'card_template_search_bar') {
            liteblogApis.addCard({
                order: String(order),
                template: template,
            }, success = function (data) {
                console.log(data);
                CancelInputBox();
                window.Ntf.add("Added Successfully!", {
                    timeout: 3000,
                    type: "success",
                    onRemove: function () {
                        window.location.reload();
                    },
                    i18n: "added-successfully"
                })
            }, error = function (data) {
                console.log(data);
                window.Ntf.error("Failed to add card.", {
                    i18n: "failed-to-add-card",
                });
            })
        }



    } else if (mode == "edit") {
        // edit card
        liteblogApis.editCard({
            id: window._edit_card_id,
            card_title: title,
            card_description: description,
            card_link: link,
            card_image: image,
            icon: icon,
            order: String(order),
            template: template,
            redirect_type: redirect_type,
        }, success = function (data) {
            console.log(data);
            CancelInputBox();
            window.Ntf.add("Edited Successfully!", {
                timeout: 3000,
                type: "success",
                onRemove: function () {
                    window.location.reload();
                },
                i18n: "edited-successfully"
            })
        }, error = function (data) {
            console.log(data);
            window.Ntf.error("Failed to edit card.", {
                i18n: "failed-to-edit-card",
            });
        })
    }
}

function buildArticle(type, title, desc, img, link) {
    switch (type) {
        case "proxy":
            domparser = new DOMParser();
            new_post = domparser.parseFromString(template_new_post, "text/html").body.firstChild;
            new_post.querySelector("#post-title") ? new_post.querySelector("#post-title").textContent = title : null;
            new_post.querySelector("#post-description") ? new_post.querySelector("#post-description").textContent = desc : null;
            new_post.querySelector("#image-container-img") ? new_post.querySelector("#image-container-img").setAttribute("src", img) : null;
            new_post.querySelector("#image-container-img") ? new_post.querySelector("#image-container-img").setAttribute("alt", title) : null;
            new_post.querySelector(".data-container") ? new_post.querySelector(".data-container").setAttribute("data-link", link) : null;
            return new_post.outerHTML;
        // case "direct":
        //     domparser = new DOMParser();
        //     new_post = domparser.parseFromString(template_new_post_direct, "text/html").body.firstChild;
        //     new_post.querySelector("#post-title") ? new_post.querySelector("#post-title").textContent = title : null;
        //     new_post.querySelector("#post-description") ? new_post.querySelector("#post-description").textContent = desc : null;
        //     new_post.querySelector("#image-container-img") ? new_post.querySelector("#image-container-img").setAttribute("src", img) : null;
        //     new_post.querySelector("#image-container-img") ? new_post.querySelector("#image-container-img").setAttribute("alt", title) : null;
        //     new_post.querySelector(".data-container") ? new_post.querySelector(".data-container").setAttribute("data-link", link) : null;
        //   return new_post.outerHTML;
        default:
            return "";
    }

}

function SwitchTheme() {
    // switch theme
    const current_theme = document.documentElement.getAttribute("data-theme");
    if (current_theme == "light") {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
    console.log("SwitchTheme");
}

function InitTheme() {
    // get theme from localStorage
    const theme = localStorage.getItem("theme");
    if (theme) {
        document.documentElement.setAttribute("data-theme", theme);
    } else {
        // get meta theme-color
        const themeMedia = window.matchMedia("(prefers-color-scheme: light)");
        if (themeMedia.matches) {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }

}

function CancelInputBox() {
    document.querySelectorAll(".card-input-box").forEach(function (box) {
        box.remove();
    });
}

function askForAccess() {
    thisServerIdentify = "{{rendered:token_encrypt_key}}"
    if (localStorage.getItem("accessPath") && localStorage.getItem("loginToken") && localStorage.getItem("loginTokenExpireTime") && localStorage.getItem("loginServerIdentify")) {
        path = localStorage.getItem("accessPath");
        loginToken = localStorage.getItem("loginToken");
        loginTokenExpireTime = localStorage.getItem("loginTokenExpireTime");
        serverIdentify = localStorage.getItem("loginServerIdentify");

        if (loginToken && parseInt(loginTokenExpireTime) > new Date().getTime() / 1000 && thisServerIdentify === serverIdentify) { // check if login token expired
            liteblogApis.setBackendLoginToken(path, loginToken, loginTokenExpireTime);
            return true;
        } else {
            console.log("login token expired");
        } // timeout
    }
    window.open("/login.html?" + "blank=true" + "&redirect=" + location.href, "_blank")
}

function clearSavedAccess() {
    localStorage.removeItem("accessPath");
    localStorage.removeItem("accessKey");
    window.Ntf.success("Access path and access key cleared.");
}

InitTheme();