define(["layoutManager", "globalize", "require", "events", "browser", "alphaPicker", "emby-input", "flexStyles", "material-icons", "css!./searchfields"], function(layoutManager, globalize, require, events, browser, AlphaPicker) {
    "use strict";

    function onSearchTimeout() {
        var instance = this,
            value = instance.nextSearchValue;
        value = (value || "").trim(), events.trigger(instance, "search", [value])
    }

    function triggerSearch(instance, value) {
        instance.searchTimeout && clearTimeout(instance.searchTimeout), instance.nextSearchValue = value, instance.searchTimeout = setTimeout(onSearchTimeout.bind(instance), 400)
    }

    function onAlphaValueClicked(e) {
        var value = e.detail.value,
            searchFieldsInstance = this,
            txtSearch = searchFieldsInstance.options.element.querySelector(".searchfields-txtSearch");
        if ("backspace" === value) {
            var val = txtSearch.value;
            txtSearch.value = val.length ? val.substring(0, val.length - 1) : ""
        } else txtSearch.value += value;
        txtSearch.dispatchEvent(new CustomEvent("input", {
            bubbles: !0
        }))
    }

    function initAlphaPicker(alphaPickerElement, instance) {
        instance.alphaPicker = new AlphaPicker({
            element: alphaPickerElement,
            mode: "keyboard"
        }), alphaPickerElement.addEventListener("alphavalueclicked", onAlphaValueClicked.bind(instance))
    }

    function onSearchInput(e) {
        triggerSearch(this, e.target.value)
    }

    function embed(elem, instance, options) {
        require(["text!./searchfields.template.html"], function(template) {
            var html = globalize.translateDocument(template, "sharedcomponents");
            (browser.tizen || browser.orsay) && (html = html.replace("<input ", "<input readonly ")), elem.innerHTML = html, elem.classList.add("searchFields");
            var txtSearch = elem.querySelector(".searchfields-txtSearch");
            if (layoutManager.tv) {
                var alphaPickerElement = elem.querySelector(".alphaPicker");
                elem.querySelector(".alphaPicker").classList.remove("hide"), initAlphaPicker(alphaPickerElement, instance)
            }
            txtSearch.addEventListener("input", onSearchInput.bind(instance)), instance.focus()
        })
    }

    function SearchFields(options) {
        this.options = options, embed(options.element, this, options)
    }
    return SearchFields.prototype.focus = function() {
        this.options.element.querySelector(".searchfields-txtSearch").focus()
    }, SearchFields.prototype.destroy = function() {
        var options = this.options;
        options && options.element.classList.remove("searchFields"), this.options = null;
        var alphaPicker = this.alphaPicker;
        alphaPicker && alphaPicker.destroy(), this.alphaPicker = null;
        var searchTimeout = this.searchTimeout;
        searchTimeout && clearTimeout(searchTimeout), this.searchTimeout = null, this.nextSearchValue = null
    }, SearchFields
});