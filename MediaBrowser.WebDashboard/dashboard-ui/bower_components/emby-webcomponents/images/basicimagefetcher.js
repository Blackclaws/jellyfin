define(["dom"], function(dom) {
    "use strict";

    function loadImage(elem, url) {
        return elem ? "IMG" !== elem.tagName ? (elem.style.backgroundImage = "url('" + url + "')", Promise.resolve()) : loadImageIntoImg(elem, url) : Promise.reject("elem cannot be null")
    }

    function loadImageIntoImg(elem, url) {
        return new Promise(function(resolve, reject) {
            dom.addEventListener(elem, "load", resolve, {
                once: !0
            }), elem.setAttribute("src", url)
        })
    }
    return {
        loadImage: loadImage
    }
});