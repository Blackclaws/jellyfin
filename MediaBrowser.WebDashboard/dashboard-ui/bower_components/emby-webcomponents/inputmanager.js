define(["playbackManager", "focusManager", "appRouter", "dom"], function(playbackManager, focusManager, appRouter, dom) {
    "use strict";

    function notify() {
        lastInputTime = (new Date).getTime(), handleCommand("unknown")
    }

    function notifyMouseMove() {
        lastInputTime = (new Date).getTime()
    }

    function idleTime() {
        return (new Date).getTime() - lastInputTime
    }

    function select(sourceElement) {
        sourceElement.click()
    }

    function on(scope, fn) {
        eventListenerCount++, dom.addEventListener(scope, "command", fn, {})
    }

    function off(scope, fn) {
        eventListenerCount && eventListenerCount--, dom.removeEventListener(scope, "command", fn, {})
    }

    function checkCommandTime(command) {
        var last = commandTimes[command] || 0,
            now = (new Date).getTime();
        return !(now - last < 1e3) && (commandTimes[command] = now, !0)
    }

    function handleCommand(name, options) {
        lastInputTime = (new Date).getTime();
        var sourceElement = options ? options.sourceElement : null;
        if (sourceElement && (sourceElement = focusManager.focusableParent(sourceElement)), sourceElement = sourceElement || document.activeElement || window, eventListenerCount) {
            var customEvent = new CustomEvent("command", {
                detail: {
                    command: name
                },
                bubbles: !0,
                cancelable: !0
            });
            if (!sourceElement.dispatchEvent(customEvent)) return
        }
        switch (name) {
            case "up":
                focusManager.moveUp(sourceElement);
                break;
            case "down":
                focusManager.moveDown(sourceElement);
                break;
            case "left":
                focusManager.moveLeft(sourceElement);
                break;
            case "right":
                focusManager.moveRight(sourceElement);
                break;
            case "home":
                appRouter.goHome();
                break;
            case "settings":
                appRouter.showSettings();
                break;
            case "back":
                appRouter.back();
                break;
            case "forward":
                break;
            case "select":
                select(sourceElement);
                break;
            case "pageup":
            case "pagedown":
            case "end":
                break;
            case "menu":
            case "info":
                break;
            case "nextchapter":
                playbackManager.nextChapter();
                break;
            case "next":
            case "nexttrack":
                playbackManager.nextTrack();
                break;
            case "previous":
            case "previoustrack":
                playbackManager.previousTrack();
                break;
            case "previouschapter":
                playbackManager.previousChapter();
                break;
            case "guide":
                appRouter.showGuide();
                break;
            case "recordedtv":
                appRouter.showRecordedTV();
                break;
            case "record":
                break;
            case "livetv":
                appRouter.showLiveTV();
                break;
            case "mute":
                playbackManager.setMute(!0);
                break;
            case "unmute":
                playbackManager.setMute(!1);
                break;
            case "togglemute":
                playbackManager.toggleMute();
                break;
            case "channelup":
                playbackManager.channelUp();
                break;
            case "channeldown":
                playbackManager.channelDown();
                break;
            case "volumedown":
                playbackManager.volumeDown();
                break;
            case "volumeup":
                playbackManager.volumeUp();
                break;
            case "play":
                playbackManager.unpause();
                break;
            case "pause":
                playbackManager.pause();
                break;
            case "playpause":
                playbackManager.playPause();
                break;
            case "stop":
                checkCommandTime("stop") && playbackManager.stop();
                break;
            case "changezoom":
                playbackManager.toggleAspectRatio();
                break;
            case "changeaudiotrack":
                playbackManager.changeAudioStream();
                break;
            case "changesubtitletrack":
                playbackManager.changeSubtitleStream();
                break;
            case "search":
                appRouter.showSearch();
                break;
            case "favorites":
                appRouter.showFavorites();
                break;
            case "fastforward":
                playbackManager.fastForward();
                break;
            case "rewind":
                playbackManager.rewind();
                break;
            case "togglefullscreen":
                playbackManager.toggleFullscreen();
                break;
            case "disabledisplaymirror":
                playbackManager.enableDisplayMirroring(!1);
                break;
            case "enabledisplaymirror":
                playbackManager.enableDisplayMirroring(!0);
                break;
            case "toggledisplaymirror":
                playbackManager.toggleDisplayMirroring();
                break;
            case "togglestats":
                break;
            case "movies":
            case "music":
            case "tv":
                appRouter.goHome();
                break;
            case "nowplaying":
                appRouter.showNowPlaying();
                break;
            case "save":
            case "screensaver":
            case "refresh":
            case "changebrightness":
            case "red":
            case "green":
            case "yellow":
            case "blue":
            case "grey":
            case "brown":
                break;
            case "repeatnone":
                playbackManager.setRepeatMode("RepeatNone");
                break;
            case "repeatall":
                playbackManager.setRepeatMode("RepeatAll");
                break;
            case "repeatone":
                playbackManager.setRepeatMode("RepeatOne")
        }
    }
    var lastInputTime = (new Date).getTime(),
        eventListenerCount = 0,
        commandTimes = {};
    return dom.addEventListener(document, "click", notify, {
        passive: !0
    }), {
        trigger: handleCommand,
        handle: handleCommand,
        notify: notify,
        notifyMouseMove: notifyMouseMove,
        idleTime: idleTime,
        on: on,
        off: off
    }
});