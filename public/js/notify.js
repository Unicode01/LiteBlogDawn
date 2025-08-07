document.addEventListener("DOMContentLoaded", function () {
    window.Ntf = new Notify({
        position: "top-center",
        notifyMargin: 5,
        notifyIconSize: 25,
        notifyMessageMarginRight: 20,
        maxList: 5,
    }, {
        timeout: 3000,
        onClick: function (notify) {
            window.Ntf.remove(notify.id);
        }
    }
    )
});

class Notify {
    constructor(settings, defaultOptions) {
        this.notifyList = {}; // id => notifyNode
        this.domParser = new DOMParser();
        // this.current_theme = GetTheme();
        this.notifyCounter = 0;
        this.notiContainer = this.domParser.parseFromString(`
            <div class="notify-container">

            </div>
            `, "text/html").body.firstChild;
        this.basicNotify = this.domParser.parseFromString(`
            <div class="notify" notify-id="">
                <div class="notify-icon">
                    <i class=""></i>
                </div>
                <div class="notify-content">
                    <div class="notify-message"></div>
                </div>
                
            </div>
            `, "text/html").body.firstChild;
        this.Settings = Object.assign({}, {
            containerHeight: 400,
            containerWidth: 300,
            notifyWidth: 250,
            notifyHeight: 45,
            notifyMargin: 10,
            notifyFontSize: 14,
            notifyIconSize: 20,
            notifyMessageMarginRight: 10,
            progressMode: "center",  // left,center,right
            progressColor: "#007BFF",
            maxList: 5,
            animationDuration: 300,
            position: "top-left", // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
            extraStyle: null,
        }, settings);
        this.defaultOptions = Object.assign({}, {
            icon: '/img/notify-info.svg',
            type: 'info', // success, warning, error, info
            timeout: 5000, // 0: never close, otherwise in milliseconds
            keepAlive: false, // true: 不会因maxList限制而自动关闭，false: 会自动关闭
            onClick: null,
            onRemove: null,
            onTimeout: null,
            onShow: null,
            onHover: null,
            extraStyle: null,
        }, defaultOptions);

        // set properties
        this.notiContainer.classList.add(this.Settings.position);
        this.notiContainer.style.setProperty("--notify-container-width", this.Settings.containerWidth + "px");
        this.notiContainer.style.setProperty("--notify-container-height", this.Settings.containerHeight + "px");
        this.notiContainer.style.setProperty("--notify-width", this.Settings.notifyWidth + "px");
        this.notiContainer.style.setProperty("--notify-height", this.Settings.notifyHeight + "px");
        this.notiContainer.style.setProperty("--notify-margin", this.Settings.notifyMargin + "px");
        this.notiContainer.style.setProperty("--notify-message-margin-right", this.Settings.notifyMessageMarginRight + "px");
        this.notiContainer.style.setProperty("--notify-icon-size", this.Settings.notifyIconSize + "px");
        this.notiContainer.style.setProperty("--notify-font-size", this.Settings.notifyFontSize + "px");
        this.notiContainer.style.setProperty("--notify-animation-duration", this.Settings.animationDuration + "ms");
        this.notiContainer.style.setProperty("--progress-color", this.Settings.progressColor)
        this.notiContainer.style.setProperty("--notify-border-radius", "8px")
        this.notiContainer.style.setProperty("--progress-transform-origin", "center")
        this.notiContainer.style.setProperty("--progress-scale", "1")

        // set extra style
        if (this.Settings.extraStyle) {
            for (let key in this.Settings.extraStyle) {
                this.notiContainer.style[key] = this.Settings.extraStyle[key];
            }
        }

        // set theme
        this.notiContainer.classList.add(this.current_theme + "-theme");

        document.body.appendChild(this.notiContainer);

        // add event listener
        // addThemeSwitchBroadcastListener((theme) => {
        //     this.notiContainer.classList.remove(this.current_theme + "-theme");
        //     this.notiContainer.classList.add(theme + "-theme");
        //     this.current_theme = theme;
        // });
    }

    add(message, options) {
        let newNotify = {
            message: message,
            options: Object.assign({}, this.defaultOptions, options),
            id: Math.random().toString(36).slice(2, 10), // get random id
            index: this.notifyCounter++,
            status: "showing", // showing, removed
        };
        if (!options?.icon) {
            switch (newNotify.options.type) {
                case "success":
                    newNotify.options.icon = "fa-check-circle";
                    break;
                case "warning":
                    newNotify.options.icon = "fa-exclamation-triangle";
                    break;
                case "error":
                    newNotify.options.icon = "fa-times-circle";
                    break;
                default:
                    newNotify.options.icon = "fa-info-circle";
                    break;
            }
        }

        // console.log(newNotify);
        this.notifyList[newNotify.id] = newNotify;
        let childNode = this.basicNotify.cloneNode(true);
        // set properties
        childNode.querySelector(".notify-icon i").classList.add("fa",newNotify.options.icon);
        childNode.classList.add(newNotify.options.type);
        childNode.querySelector(".notify-message").textContent = message;
        childNode.setAttribute("notify-id", newNotify.id);
        // set extra style
        if (newNotify.options.extraStyle) {
            for (let key in newNotify.options.extraStyle) {
                childNode.style[key] = newNotify.options.extraStyle[key];
            }
        }
        // add event listener
        childNode.addEventListener("click", (e) => {
            e.stopPropagation();
            this.onEvent("click", newNotify.id, e);
        });
        childNode.addEventListener("mouseenter", (e) => {
            e.stopPropagation();
            this.onEvent("hover", newNotify.id, e);
        });
        childNode.addEventListener("mouseleave", (e) => {
            e.stopPropagation();
            this.onEvent("hover", newNotify.id, e);
        });

        this.notiContainer.insertBefore(childNode, this.notiContainer.firstChild);

        // check timeout
        if (newNotify.options.timeout > 0) {
            setTimeout(() => {
                this.onEvent("timeout", newNotify.id, null);
                this.remove(newNotify.id);
            }, newNotify.options.timeout);
        }

        // check onShow
        if (newNotify.options.onShow) {
            this.onEvent("show", newNotify.id, null);
        }

        // add animation class
        childNode.classList.add("notify-show");

        // add remove animation class timeout
        setTimeout(() => {
            childNode.classList.remove("notify-show");
        }, this.Settings.animationDuration);

        // check if need to close
        if (this.Settings.maxList > 0 && Object.keys(this.notifyList).length > this.Settings.maxList) {
            let selected = [];
            let needToRemove = Object.keys(this.notifyList).length - this.Settings.maxList;

            console.log("need to remove:", needToRemove);
            for (let id in this.notifyList) {
                if (selected.length >= needToRemove) {
                    break;
                }
                if (this.notifyList[id].status == "showing" && !this.notifyList[id].options.keepAlive) {
                    selected.push(this.notifyList[id]);
                }
            }
            console.log("selected:", selected);
            for (let i = 0; i < selected.length; i++) {
                console.log("remove oldest notify:", selected[i].index);
                this.remove(selected[i].id);
            }
        }

        // set properties
        if (newNotify.options.timeout > 0) {
            childNode.style.setProperty("--notify-duration", newNotify.options.timeout + "ms")
            switch (this.Settings.progressMode) {
                case "center":
                    childNode.offsetHeight // force reflow
                    childNode.style.setProperty("--progress-scale", "0")
                    break;
                case "left":
                    childNode.style.setProperty("--progress-transform-origin", "left")
                    childNode.offsetHeight // force reflow
                    childNode.style.setProperty("--progress-scale", "0")
                    break;
                case "right":
                    childNode.style.setProperty("--progress-transform-origin", "right")
                    childNode.offsetHeight // force reflow
                    childNode.style.setProperty("--progress-scale", "0")
                    break;
            }

        } else {
            // remove progress bar
            childNode.style.setProperty("--notify-duration", "0ms")
            childNode.style.setProperty("--progress-scale", "0")
        }


        return newNotify.id;
    }

    alert(message) {
        return this.add(message, {
            type: "info",
            timeout: 3000,
            keepAlive: true,
            onClick: (notify, event) => {
                this.remove(notify.id);
            }
        });
    }

    error(message) {
        return this.add(message, {
            type: "error",
            keepAlive: true,
            onClick: (notify, event) => {
                this.remove(notify.id);
            }
        });
    }

    success(message) {
        return this.add(message, {
            type: "success",
            keepAlive: true,
            onClick: (notify, event) => {
                this.remove(notify.id);
            }
        });
    }

    warning(message) {
        return this.add(message, {
            type: "warning",
            keepAlive: true,
            onClick: (notify, event) => {
                this.remove(notify.id);
            }
        });
    }

    info(message) {
        return this.add(message, {
            type: "info",
            onClick: (notify, event) => {
                this.remove(notify.id);
            }
        });
    }

    remove(id) {
        if (!this.notifyList[id] || this.notifyList[id].status == "removed") { // if not exist, return
            return;
        }
        this.notifyList[id].status = "removed";
        this.onEvent("remove", id, null);
        // query node
        const node = this.notiContainer.querySelector('[notify-id="' + id + '"]');
        if (node) {
            // remove node
            // node.remove();
            // remove from list
            delete this.notifyList[id];
            // show remove animation
            node.classList.add("notify-remove");
            setTimeout(() => {
                node.remove();
            }, this.Settings.animationDuration);
        }
    }

    onEvent(event, id, broswerEvent) {
        let notify = null;
        switch (event) {
            case "click":
                notify = this.notifyList[id];
                if (notify?.options.onClick) {
                    notify.options.onClick(notify, broswerEvent);
                }
                break;
            case "remove":
                notify = this.notifyList[id];
                if (notify?.options.onRemove) {
                    notify.options.onRemove(notify);
                }
                break;
            case "timeout":
                notify = this.notifyList[id];
                if (notify?.options.onTimeout) {
                    notify.options.onTimeout(notify);
                }
                break;
            case "show":
                notify = this.notifyList[id];
                if (notify?.options.onShow) {
                    notify.options.onShow(notify);
                }
                break;
            case "hover":
                notify = this.notifyList[id];
                if (notify?.options.onHover) {
                    notify.options.onHover(notify, broswerEvent);
                }
                break;
            default:
                break;
        }
    }

    destroy() {
        for (let id in this.notifyList) {
            this.remove(id);
        }
        this.notiContainer.remove();
    }
}