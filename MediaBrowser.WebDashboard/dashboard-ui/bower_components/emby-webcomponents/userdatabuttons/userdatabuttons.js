define(["connectionManager", "globalize", "dom", "itemHelper", "paper-icon-button-light", "material-icons", "emby-button", "css!./userdatabuttons"], function(connectionManager, globalize, dom, itemHelper) {
    "use strict";

    function getUserDataButtonHtml(method, itemId, serverId, buttonCssClass, iconCssClass, icon, tooltip, style) {
        "fab-mini" === style && (style = "fab", buttonCssClass = buttonCssClass ? buttonCssClass + " mini" : "mini");
        var is = "fab" === style ? "emby-button" : "paper-icon-button-light",
            className = "fab" === style ? "autoSize fab" : "autoSize";
        return buttonCssClass && (className += " " + buttonCssClass), iconCssClass ? iconCssClass += " " : iconCssClass = "", iconCssClass += "md-icon", '<button title="' + tooltip + '" data-itemid="' + itemId + '" data-serverid="' + serverId + '" is="' + is + '" data-method="' + method + '" class="' + className + '"><i class="' + iconCssClass + '">' + icon + "</i></button>"
    }

    function onContainerClick(e) {
        var btnUserData = dom.parentWithClass(e.target, "btnUserData");
        if (btnUserData) {
            var method = btnUserData.getAttribute("data-method");
            userDataMethods[method](btnUserData)
        }
    }

    function fill(options) {
        var html = getIconsHtml(options);
        "insertAdjacent" === options.fillMode ? options.element.insertAdjacentHTML(options.insertLocation || "beforeend", html) : options.element.innerHTML = html, dom.removeEventListener(options.element, "click", onContainerClick, {
            passive: !0
        }), dom.addEventListener(options.element, "click", onContainerClick, {
            passive: !0
        })
    }

    function destroy(options) {
        options.element.innerHTML = "", dom.removeEventListener(options.element, "click", onContainerClick, {
            passive: !0
        })
    }

    function getIconsHtml(options) {
        var item = options.item,
            includePlayed = options.includePlayed,
            cssClass = options.cssClass,
            style = options.style,
            html = "",
            userData = item.UserData || {},
            itemId = item.Id;
        if (itemHelper.isLocalItem(item)) return html;
        var btnCssClass = "btnUserData";
        cssClass && (btnCssClass += " " + cssClass);
        var iconCssClass = options.iconCssClass,
            serverId = item.ServerId;
        if (!1 !== includePlayed) {
            var tooltipPlayed = globalize.translate("sharedcomponents#MarkPlayed");
            itemHelper.canMarkPlayed(item) && (html += userData.Played ? getUserDataButtonHtml("markPlayed", itemId, serverId, btnCssClass + " btnUserDataOn", iconCssClass, "&#xE5CA;", tooltipPlayed, style) : getUserDataButtonHtml("markPlayed", itemId, serverId, btnCssClass, iconCssClass, "&#xE5CA;", tooltipPlayed, style))
        }
        var tooltipFavorite = globalize.translate("sharedcomponents#Favorite");
        return html += userData.IsFavorite ? getUserDataButtonHtml("markFavorite", itemId, serverId, btnCssClass + " btnUserData btnUserDataOn", iconCssClass, "&#xE87D;", tooltipFavorite, style) : getUserDataButtonHtml("markFavorite", itemId, serverId, btnCssClass + " btnUserData", iconCssClass, "&#xE87D;", tooltipFavorite, style)
    }

    function markFavorite(link) {
        var id = link.getAttribute("data-itemid"),
            serverId = link.getAttribute("data-serverid"),
            markAsFavorite = !link.classList.contains("btnUserDataOn");
        favorite(id, serverId, markAsFavorite), markAsFavorite ? link.classList.add("btnUserDataOn") : link.classList.remove("btnUserDataOn")
    }

    function markLike(link) {
        var id = link.getAttribute("data-itemid"),
            serverId = link.getAttribute("data-serverid");
        link.classList.contains("btnUserDataOn") ? (clearLike(id, serverId), link.classList.remove("btnUserDataOn")) : (likes(id, serverId, !0), link.classList.add("btnUserDataOn")), link.parentNode.querySelector(".btnDislike").classList.remove("btnUserDataOn")
    }

    function markDislike(link) {
        var id = link.getAttribute("data-itemid"),
            serverId = link.getAttribute("data-serverid");
        link.classList.contains("btnUserDataOn") ? (clearLike(id, serverId), link.classList.remove("btnUserDataOn")) : (likes(id, serverId, !1), link.classList.add("btnUserDataOn")), link.parentNode.querySelector(".btnLike").classList.remove("btnUserDataOn")
    }

    function markPlayed(link) {
        var id = link.getAttribute("data-itemid"),
            serverId = link.getAttribute("data-serverid");
        link.classList.contains("btnUserDataOn") ? (played(id, serverId, !1), link.classList.remove("btnUserDataOn")) : (played(id, serverId, !0), link.classList.add("btnUserDataOn"))
    }

    function likes(id, serverId, isLiked) {
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient.updateUserItemRating(apiClient.getCurrentUserId(), id, isLiked)
    }

    function played(id, serverId, isPlayed) {
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient[isPlayed ? "markPlayed" : "markUnplayed"](apiClient.getCurrentUserId(), id, new Date)
    }

    function favorite(id, serverId, isFavorite) {
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite)
    }

    function clearLike(id, serverId) {
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient.clearUserItemRating(apiClient.getCurrentUserId(), id)
    }
    var userDataMethods = {
        markPlayed: markPlayed,
        markDislike: markDislike,
        markLike: markLike,
        markFavorite: markFavorite
    };
    return {
        fill: fill,
        destroy: destroy,
        getIconsHtml: getIconsHtml
    }
});