this.liteblogApis = {
    setBackendPathAndAccessToken: function (path, accessToken) {
        this.backendPath = path;
        this.accessToken = accessToken;
    },
    setBackendLoginToken: function (path, loginToken, expire_time) {
        this.backendPath = path;
        this.loginToken = loginToken;
        this.loginTokenExpireTime = parseInt(expire_time);
    },
    getConfusedToken: function () {
        if (this.loginToken && this.loginTokenExpireTime > (new Date().getTime()/1000)) {
            return this.loginToken;
        }
        class Xorshift32 {
            constructor(seed) {
                if (seed === 0) throw new Error("Seed cannot be zero");
                this.state = seed >>> 0;
            }

            next() {
                let x = this.state;
                x ^= x << 13;
                x ^= x >>> 17;
                x ^= x << 5;
                this.state = x >>> 0;
                return this.state;
            }

            random() {
                return this.next() / 0x100000000;
            }
        }
        let token = this.accessToken;
        var encryptKey = `{{rendered:token_encrypt_key}}`;
        const timestamp = parseInt((new Date().getTime()) / 10000); // 时间梯度10s
        // console.log(timestamp);
        const timestampB64 = btoa(timestamp.toString());
        // console.log(timestampB64);
        encryptKey = encryptKey + timestampB64;
        let tokenArray = Array.from(btoa(token + "|" + encryptKey));
        let XorshiftSeed = 2166136261 >>> 0;

        for (let i = 0; i < tokenArray.length; i++) {
            XorshiftSeed = Math.imul(XorshiftSeed, 16777619);
            XorshiftSeed = (XorshiftSeed ^ tokenArray[i].charCodeAt(0)) >>> 0;
        }
        // console.log("XorshiftSeed: " + XorshiftSeed);
        const xorshift = new Xorshift32(XorshiftSeed);

        const getRandomChar = (seed) => String.fromCharCode(33 + ((seed + xorshift.next()) % 94));

        for (let i = 0; i < encryptKey.length; i++) {
            const charCode = encryptKey.charCodeAt(i);
            const operation = charCode % 5;

            switch (operation) {
                case 0:
                    tokenArray.unshift(getRandomChar(charCode + i));
                    break;

                case 1:
                    if (tokenArray.length > 0) {
                        const pos = (charCode * i) % tokenArray.length;
                        tokenArray[pos] = getRandomChar(charCode ^ tokenArray[pos].charCodeAt(0));
                    }
                    break;

                case 2:
                    mod = xorshift.next() % (tokenArray.length + 1);
                    if (mod == 0) {
                        mod = 1;
                    }
                    insertPos = charCode % mod
                    // console.log("insertPos: " + insertPos);
                    tokenArray.splice(insertPos, 0,
                        getRandomChar(charCode),
                        getRandomChar(charCode + 997)
                    );
                    break;

                case 3:
                    if (tokenArray.length > 1) {
                        const pos1 = charCode % tokenArray.length;
                        const pos2 = tokenArray.length - 1 - pos1;
                        [tokenArray[pos1], tokenArray[pos2]] = [tokenArray[pos2], tokenArray[pos1]];
                    }
                    break;

                default:
                    const pseudo = ['==', '=', '=A', 'B='][charCode % 4];
                    tokenArray.push(...Array.from(pseudo));
            }
        }

        const finalShuffle = [];
        while (tokenArray.length > 0) {
            const randIndex = xorshift.next() % tokenArray.length;
            finalShuffle.push(tokenArray.splice(randIndex, 1)[0]);
        }

        return finalShuffle.join('');
    },
    // card class
    editOrder: function (changes, success, error) {
        fetch("/" + this.backendPath + "/edit_order", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                changes: changes,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    deleteCard: function (cardId, success, error) {
        fetch("/" + this.backendPath + "/delete_card", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                cardID: cardId,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    addCard: function (card, success, error) {
        fetch("/" + this.backendPath + "/add_card", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                card: card,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    getCard: function (cardID, success, error) {
        fetch("/" + this.backendPath + "/get_card", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                cardID: cardID,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    getAllCards: function (success, error) {
        fetch("/" + this.backendPath + "/get_all_cards", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    editCard: function (card, success, error) {
        fetch("/" + this.backendPath + "/edit_card", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                card: card,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    // article class
    addArticle: function (article, success, error) {
        fetch("/" + this.backendPath + "/add_article", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                article: article,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    editArticle: function (article, success, error) {
        fetch("/" + this.backendPath + "/edit_article", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                article: article,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    deleteArticle: function (article_id, success, error) {
        fetch("/" + this.backendPath + "/delete_article", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                article_id: article_id,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    getArticle: function (article_id, success, error) {
        fetch("/" + this.backendPath + "/get_article", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                article_id: article_id,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    getAllArticleId: function (success, error) {
        fetch("/" + this.backendPath + "/get_all_article_id", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            }) // e.g. ["12","23"]
            .then(data => success(data))
            .catch(e => error(e));
    },
    deleteComment: function (article_id, comment_id, success, error) {
        fetch("/" + this.backendPath + "/delete_comment", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                article_id: article_id,
                comment_id: comment_id,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    // setting class
    getCustomSettings: function (success, error) {
        fetch("/" + this.backendPath + "/get_custom_settings", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    editCustomSettings: function (custom_settings, success, error) {
        fetch("/" + this.backendPath + "/edit_custom_settings", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                custom_settings: custom_settings,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    // other class
    login: function (success, error) {
        fetch("/" + this.backendPath + "/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: this.getConfusedToken(),
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => {
                this.setBackendLoginToken(this.backendPath, data.token, data.timeout);
                success(data);
            })
            .catch(e => error(e));
    },
    // public class
    addComment: function (verify_token, article_id, content, author, email, reply_to, subscribed, success, error) {
        fetch("/api/v1/add_comment", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: this.getConfusedToken(),
                verify_token: verify_token,
                article_id: article_id,
                content: content,
                author: author,
                email: email,
                reply_to: reply_to,
                subscribed: subscribed,
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },
    getSnifferInfo: function (path, success, error) {
        fetch("/api/v1/sniffer?path=" + path, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok: ' + response.status);
                }
            })
            .then(data => success(data))
            .catch(e => error(e));
    },

}