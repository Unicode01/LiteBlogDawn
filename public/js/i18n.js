class i18n {
    constructor() {
        this.translations = {}
    }
    init(lang) {
        if (!lang) {
            lang = this.get_language_code()
        }
        fetch("/i18n/" + lang + ".json")
            .then(response => response.json())
            .then(data => {
                this.translations = data
                window.i18n = this
                this.trans_all()
                this.setupMutationObserver()
            })
            .catch(error => console.error(error))
    }

    trans_all() {
        document.querySelectorAll("*[data-i18n]").forEach(element => {
            this.translateElement(element);
        });
    }

    translateElement(element) {
        if (element.hasAttribute('data-i18n')) {
            const key = element.getAttribute('data-i18n');
            if (this.translations[key]) {
                if (element.textContent.trim() === "") return; // don't translate empty elements
                if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
                    element.firstChild.textContent = " " + this.translations[key] + " ";
                }
            }
        }
    }

    get_language_code() {
        console.log(navigator.language)
        return navigator.language
    }

    setupMutationObserver() {
        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) this.translateElementAndChildren(node);
                });
            });
        });

        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    translateElementAndChildren(element) {
        this.translateElement(element);
        element.querySelectorAll('*').forEach(child => this.translateElement(child));
    }

    get_translation(key, defaultv) {
        if (!this.translations[key]) {
            return defaultv
        }
        return this.translations[key]
    }
}



document.addEventListener("DOMContentLoaded", function () {
    i18n = new i18n();
    lang = i18n.get_language_code();
    params = new URLSearchParams(window.location.search);
    if (params.has("lang")) {
        lang = params.get("lang");
    }
    i18n.init(lang);
});