define(["dom", "scroller", "browser", "layoutManager", "focusManager", "registerElement", "css!./emby-tabs", "scrollStyles"], function(dom, scroller, browser, layoutManager, focusManager) {
    "use strict";

    function setActiveTabButton(tabs, newButton, oldButton, animate) {
        newButton.classList.add(activeButtonClass)
    }

    function getFocusCallback(tabs, e) {
        return function() {
            onClick.call(tabs, e)
        }
    }

    function onFocus(e) {
        layoutManager.tv && (this.focusTimeout && clearTimeout(this.focusTimeout), this.focusTimeout = setTimeout(getFocusCallback(this, e), 700))
    }

    function getTabPanel(tabs, index) {
        return null
    }

    function removeActivePanelClass(tabs, index) {
        var tabPanel = getTabPanel(tabs, index);
        tabPanel && tabPanel.classList.remove("is-active")
    }

    function fadeInRight(elem) {
        var pct = browser.mobile ? "4%" : "0.5%",
            keyframes = [{
                opacity: "0",
                transform: "translate3d(" + pct + ", 0, 0)",
                offset: 0
            }, {
                opacity: "1",
                transform: "none",
                offset: 1
            }];
        elem.animate(keyframes, {
            duration: 160,
            iterations: 1,
            easing: "ease-out"
        })
    }

    function triggerBeforeTabChange(tabs, index, previousIndex) {
        tabs.dispatchEvent(new CustomEvent("beforetabchange", {
            detail: {
                selectedTabIndex: index,
                previousIndex: previousIndex
            }
        })), null != previousIndex && previousIndex !== index && removeActivePanelClass(tabs, previousIndex);
        var newPanel = getTabPanel(tabs, index);
        newPanel && (newPanel.animate && fadeInRight(newPanel), newPanel.classList.add("is-active"))
    }

    function onClick(e) {
        this.focusTimeout && clearTimeout(this.focusTimeout);
        var tabs = this,
            current = tabs.querySelector("." + activeButtonClass),
            tabButton = dom.parentWithClass(e.target, buttonClass);
        if (tabButton && tabButton !== current) {
            current && current.classList.remove(activeButtonClass);
            var previousIndex = current ? parseInt(current.getAttribute("data-index")) : null;
            setActiveTabButton(tabs, tabButton, current, !0);
            var index = parseInt(tabButton.getAttribute("data-index"));
            triggerBeforeTabChange(tabs, index, previousIndex), setTimeout(function() {
                tabs.selectedTabIndex = index, tabs.dispatchEvent(new CustomEvent("tabchange", {
                    detail: {
                        selectedTabIndex: index,
                        previousIndex: previousIndex
                    }
                }))
            }, 120), tabs.scroller && tabs.scroller.toCenter(tabButton, !1)
        }
    }

    function initScroller(tabs) {
        if (!tabs.scroller) {
            var contentScrollSlider = tabs.querySelector(".emby-tabs-slider");
            contentScrollSlider ? (tabs.scroller = new scroller(tabs, {
                horizontal: 1,
                itemNav: 0,
                mouseDragging: 1,
                touchDragging: 1,
                slidee: contentScrollSlider,
                smart: !0,
                releaseSwing: !0,
                scrollBy: 200,
                speed: 120,
                elasticBounds: 1,
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
                hiddenScroll: !0,
                requireAnimation: !browser.safari,
                allowNativeSmoothScroll: !0
            }), tabs.scroller.init()) : (tabs.classList.add("scrollX"), tabs.classList.add("hiddenScrollX"), tabs.classList.add("smoothScrollX"))
        }
    }

    function getSelectedTabButton(elem) {
        return elem.querySelector("." + activeButtonClass)
    }

    function getSibling(elem, method) {
        for (var sibling = elem[method]; sibling;) {
            if (sibling.classList.contains(buttonClass) && !sibling.classList.contains("hide")) return sibling;
            sibling = sibling[method]
        }
        return null
    }
    var EmbyTabs = Object.create(HTMLDivElement.prototype),
        buttonClass = "emby-tab-button",
        activeButtonClass = buttonClass + "-active";
    EmbyTabs.createdCallback = function() {
        this.classList.contains("emby-tabs") || (this.classList.add("emby-tabs"), this.classList.add("focusable"), dom.addEventListener(this, "click", onClick, {
            passive: !0
        }), dom.addEventListener(this, "focus", onFocus, {
            passive: !0,
            capture: !0
        }))
    }, EmbyTabs.focus = function() {
        var selected = this.querySelector("." + activeButtonClass);
        selected ? focusManager.focus(selected) : focusManager.autoFocus(this)
    }, EmbyTabs.refresh = function() {
        this.scroller && this.scroller.reload()
    }, EmbyTabs.attachedCallback = function() {
        initScroller(this);
        var current = this.querySelector("." + activeButtonClass),
            currentIndex = current ? parseInt(current.getAttribute("data-index")) : parseInt(this.getAttribute("data-index") || "0");
        if (-1 !== currentIndex) {
            this.selectedTabIndex = currentIndex;
            var tabButtons = this.querySelectorAll("." + buttonClass),
                newTabButton = tabButtons[currentIndex];
            newTabButton && setActiveTabButton(this, newTabButton, current, !1)
        }
        this.readyFired || (this.readyFired = !0, this.dispatchEvent(new CustomEvent("ready", {})))
    }, EmbyTabs.detachedCallback = function() {
        this.scroller && (this.scroller.destroy(), this.scroller = null), dom.removeEventListener(this, "click", onClick, {
            passive: !0
        }), dom.removeEventListener(this, "focus", onFocus, {
            passive: !0,
            capture: !0
        })
    }, EmbyTabs.selectedIndex = function(selected, triggerEvent) {
        var tabs = this;
        if (null == selected) return tabs.selectedTabIndex || 0;
        var current = tabs.selectedIndex();
        tabs.selectedTabIndex = selected;
        var tabButtons = tabs.querySelectorAll("." + buttonClass);
        if (current === selected || !1 === triggerEvent) {
            triggerBeforeTabChange(tabs, selected, current), tabs.dispatchEvent(new CustomEvent("tabchange", {
                detail: {
                    selectedTabIndex: selected
                }
            }));
            var currentTabButton = tabButtons[current];
            setActiveTabButton(tabs, tabButtons[selected], currentTabButton, !1), current !== selected && currentTabButton && currentTabButton.classList.remove(activeButtonClass)
        } else onClick.call(tabs, {
            target: tabButtons[selected]
        })
    }, EmbyTabs.selectNext = function() {
        var current = getSelectedTabButton(this),
            sibling = getSibling(current, "nextSibling");
        sibling && onClick.call(this, {
            target: sibling
        })
    }, EmbyTabs.selectPrevious = function() {
        var current = getSelectedTabButton(this),
            sibling = getSibling(current, "previousSibling");
        sibling && onClick.call(this, {
            target: sibling
        })
    }, EmbyTabs.triggerBeforeTabChange = function(selected) {
        var tabs = this;
        triggerBeforeTabChange(tabs, tabs.selectedIndex())
    }, EmbyTabs.triggerTabChange = function(selected) {
        var tabs = this;
        tabs.dispatchEvent(new CustomEvent("tabchange", {
            detail: {
                selectedTabIndex: tabs.selectedIndex()
            }
        }))
    }, EmbyTabs.setTabEnabled = function(index, enabled) {
        var btn = this.querySelector('.emby-tab-button[data-index="' + index + '"]');
        enabled ? btn.classList.remove("hide") : btn.classList.remove("add")
    }, document.registerElement("emby-tabs", {
        prototype: EmbyTabs,
        extends: "div"
    })
});