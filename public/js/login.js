function loginInit() {
    document.getElementById('theme-btn').addEventListener('click', function () {
        SwitchTheme();
    });
    document.getElementById('login-button').addEventListener('click', function () {
        TryLogin();
    });
}

function TryLogin() {
    var access_path = document.getElementById('access-path').value;
    var access_token = document.getElementById('access-token').value;
    const loginServerIdentify = "{{rendered:token_encrypt_key}}"
    //try login
    liteblogApis.setBackendPathAndAccessToken(access_path, access_token);
    liteblogApis.login(success = function (data) {
        console.log(data);
        logintoken = data.token;
        expiretime = data.timeout;
        localStorage.setItem('accessPath', access_path);
        localStorage.setItem('loginToken', logintoken);
        localStorage.setItem('loginTokenExpireTime', expiretime);
        localStorage.setItem('loginServerIdentify', loginServerIdentify)
        window.Ntf.add('Login success!', {
            type: 'success',
            onRemove: function () {
                params = new URLSearchParams(window.location.search);
                redirect = params.get("redirect")
                blank = params.get("blank") === "true";
                if (blank) {
                    window.opener = null;
                    window.open("", "_self");
                    window.close();
                } else {
                    if (redirect) {
                        window.location.href = redirect;
                    } else {
                        window.location.href = "/";
                    }
                }
            },
            i18n: "login-success",
        })
    }, error = function (data) {
        console.log(data);
        window.Ntf.add('Login failed!', {
            type: 'error',
            i18n: "login-failed",
        })
    })
}

document.addEventListener("DOMContentLoaded", loginInit);