define(["appSettings", "loading", "browser", "emby-linkbutton"], function(appSettings, loading, browser) {
    "use strict";

    function login(page, username, password) {
        loading.show(), appSettings.enableAutoLogin(!0), ConnectionManager.loginToConnect(username, password).then(function() {
            loading.hide(), Dashboard.navigate("selectserver.html")
        }, function() {
            loading.hide(), Dashboard.alert({
                message: Globalize.translate("MessageInvalidUser"),
                title: Globalize.translate("HeaderLoginFailure")
            }), page.querySelector("#txtManualPassword").value = ""
        })
    }

    function handleConnectionResult(page, result) {
        switch (loading.hide(), result.State) {
            case "SignedIn":
                var apiClient = result.ApiClient;
                Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient), Dashboard.navigate("home.html");
                break;
            case "ServerSignIn":
                Dashboard.navigate("login.html?serverid=" + result.Servers[0].Id, !1, "none");
                break;
            case "ServerSelection":
                Dashboard.navigate("selectserver.html", !1, "none");
                break;
            case "ConnectSignIn":
                loadMode(page, "welcome");
                break;
            case "ServerUpdateNeeded":
                Dashboard.alert({
                    message: Globalize.translate("ServerUpdateNeeded", '<a href="https://emby.media">https://emby.media</a>')
                });
                break;
            case "Unavailable":
                Dashboard.alert({
                    message: Globalize.translate("MessageUnableToConnectToServer"),
                    title: Globalize.translate("HeaderConnectionFailure")
                })
        }
    }

    function loadAppConnection(page) {
        loading.show(), ConnectionManager.connect({
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then(function(result) {
            handleConnectionResult(page, result)
        })
    }

    function loadPage(page, params) {
        var mode = params.mode || "auto";
        if ("auto" == mode) {
            if (AppInfo.isNativeApp) return void loadAppConnection(page);
            mode = "connect"
        }
        loadMode(page, mode)
    }

    function loadMode(page, mode) {
        "welcome" == mode ? (page.querySelector(".connectLoginForm").classList.add("hide"), page.querySelector(".welcomeContainer").classList.remove("hide"), page.querySelector(".manualServerForm").classList.add("hide"), page.querySelector(".signupForm").classList.add("hide")) : "connect" == mode ? (page.querySelector(".connectLoginForm").classList.remove("hide"), page.querySelector(".welcomeContainer").classList.add("hide"), page.querySelector(".manualServerForm").classList.add("hide"), page.querySelector(".signupForm").classList.add("hide")) : "manualserver" == mode ? (page.querySelector(".manualServerForm").classList.remove("hide"), page.querySelector(".connectLoginForm").classList.add("hide"), page.querySelector(".welcomeContainer").classList.add("hide"), page.querySelector(".signupForm").classList.add("hide")) : "signup" == mode && (page.querySelector(".manualServerForm").classList.add("hide"), page.querySelector(".connectLoginForm").classList.add("hide"), page.querySelector(".welcomeContainer").classList.add("hide"), page.querySelector(".signupForm").classList.remove("hide"), initSignup(page))
    }

    function skip() {
        Dashboard.navigate("selectserver.html")
    }

    function requireCaptcha() {
        return !AppInfo.isNativeApp && 0 == window.location.href.toLowerCase().indexOf("https")
    }

    function supportInAppSignup() {
        return AppInfo.isNativeApp || 0 == window.location.href.toLowerCase().indexOf("https")
    }

    function initSignup(page) {
        supportInAppSignup() && requireCaptcha() && require(["https://www.google.com/recaptcha/api.js?render=explicit"], function() {
            setTimeout(function() {
                var recaptchaContainer = page.querySelector(".recaptchaContainer");
                greWidgetId = grecaptcha.render(recaptchaContainer, {
                    sitekey: "6Le2LAgTAAAAAK06Wvttt_yUnbISTy6q3Azqp9po",
                    theme: "dark"
                })
            }, 100)
        })
    }

    function submitManualServer(page) {
        var host = page.querySelector("#txtServerHost").value,
            port = page.querySelector("#txtServerPort").value;
        port && (host += ":" + port), loading.show(), ConnectionManager.connectToAddress(host, {
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then(function(result) {
            handleConnectionResult(page, result)
        }, function() {
            handleConnectionResult(page, {
                State: "Unavailable"
            })
        })
    }

    function submit(page) {
        login(page, page.querySelector("#txtManualName").value, page.querySelector("#txtManualPassword").value)
    }
    var greWidgetId;
    return function(view, params) {
        function onSubmit(e) {
            return submit(view), e.preventDefault(), !1
        }

        function onManualServerSubmit(e) {
            return submitManualServer(view), e.preventDefault(), !1
        }

        function onSignupFormSubmit(e) {
            if (!supportInAppSignup()) return e.preventDefault(), !1;
            var page = view,
                greResponse = greWidgetId ? grecaptcha.getResponse(greWidgetId) : null;
            return ConnectionManager.signupForConnect({
                email: page.querySelector("#txtSignupEmail", page).value,
                username: page.querySelector("#txtSignupUsername", page).value,
                password: page.querySelector("#txtSignupPassword", page).value,
                passwordConfirm: page.querySelector("#txtSignupPasswordConfirm", page).value,
                grecaptcha: greResponse
            }).then(function(result) {
                var msg = result.Validated ? Globalize.translate("MessageThankYouForConnectSignUpNoValidation") : Globalize.translate("MessageThankYouForConnectSignUp");
                Dashboard.alert({
                    message: msg,
                    callback: function() {
                        Dashboard.navigate("connectlogin.html?mode=welcome")
                    }
                })
            }, function(result) {
                "passwordmatch" == result.errorCode ? Dashboard.alert({
                    message: Globalize.translate("ErrorMessagePasswordNotMatchConfirm")
                }) : "USERNAME_IN_USE" == result.errorCode ? Dashboard.alert({
                    message: Globalize.translate("ErrorMessageUsernameInUse")
                }) : "EMAIL_IN_USE" == result.errorCode ? Dashboard.alert({
                    message: Globalize.translate("ErrorMessageEmailInUse")
                }) : Dashboard.alert({
                    message: Globalize.translate("DefaultErrorMessage")
                })
            }), e.preventDefault(), !1
        }

        function goBack() {
            require(["appRouter"], function(appRouter) {
                appRouter.back()
            })
        }
        view.querySelector(".btnSkipConnect").addEventListener("click", skip), view.querySelector(".connectLoginForm").addEventListener("submit", onSubmit), view.querySelector(".manualServerForm").addEventListener("submit", onManualServerSubmit), view.querySelector(".signupForm").addEventListener("submit", onSignupFormSubmit), view.querySelector(".btnSignupForConnect").addEventListener("click", function(e) {
            if (supportInAppSignup()) return e.preventDefault(), e.stopPropagation(), Dashboard.navigate("connectlogin.html?mode=signup"), !1
        }), view.querySelector(".btnCancelSignup").addEventListener("click", goBack), view.querySelector(".btnCancelManualServer").addEventListener("click", goBack), view.querySelector(".btnWelcomeNext").addEventListener("click", function() {
            Dashboard.navigate("connectlogin.html?mode=connect")
        });
        var terms = view.querySelector(".terms");
        terms.innerHTML = Globalize.translate("LoginDisclaimer") + "<div style='margin-top:5px;'><a is='emby-linkbutton' class='button-link' href='http://emby.media/terms' target='_blank'>" + Globalize.translate("TermsOfUse") + "</a></div>", AppInfo.isNativeApp ? (terms.classList.add("hide"), view.querySelector(".tvAppInfo").classList.add("hide")) : (terms.classList.remove("hide"), view.querySelector(".tvAppInfo").classList.remove("hide")), view.addEventListener("viewbeforeshow", function() {
            var page = this;
            if (page.querySelector("#txtSignupEmail").value = "", page.querySelector("#txtSignupUsername").value = "", page.querySelector("#txtSignupPassword").value = "", page.querySelector("#txtSignupPasswordConfirm").value = "", browser.safari && AppInfo.isNativeApp) page.querySelector(".embyIntroDownloadMessage").innerHTML = Globalize.translate("EmbyIntroDownloadMessageWithoutLink");
            else {
                page.querySelector(".embyIntroDownloadMessage").innerHTML = Globalize.translate("EmbyIntroDownloadMessage", '<a is="emby-linkbutton" class="button-link" href="http://emby.media" target="_blank">http://emby.media</a>')
            }
        }), view.addEventListener("viewshow", function() {
            loadPage(view, params)
        })
    }
});