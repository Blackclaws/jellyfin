define(["require", "events", "browser", "appRouter", "loading"], function(require, events, browser, appRouter, loading) {
    "use strict";

    function zoomIn(elem, iterations) {
        var keyframes = [{
                transform: "scale3d(.2, .2, .2)  ",
                opacity: ".6",
                offset: 0
            }, {
                transform: "none",
                opacity: "1",
                offset: 1
            }],
            timing = {
                duration: 240,
                iterations: iterations
            };
        return elem.animate(keyframes, timing)
    }

    function createMediaElement(instance, options) {
        return new Promise(function(resolve, reject) {
            var dlg = document.querySelector(".youtubePlayerContainer");
            dlg ? resolve(dlg.querySelector("#player")) : require(["css!./style"], function() {
                loading.show();
                var dlg = document.createElement("div");
                dlg.classList.add("youtubePlayerContainer"), options.fullscreen && dlg.classList.add("onTop"), dlg.innerHTML = '<div id="player"></div>';
                var videoElement = dlg.querySelector("#player");
                document.body.insertBefore(dlg, document.body.firstChild), instance.videoDialog = dlg, options.fullscreen && dlg.animate && !browser.slow ? zoomIn(dlg, 1).onfinish = function() {
                    resolve(videoElement)
                } : resolve(videoElement)
            })
        })
    }

    function onVideoResize() {
        var instance = this,
            player = instance.currentYoutubePlayer,
            dlg = instance.videoDialog;
        player && dlg && player.setSize(dlg.offsetWidth, dlg.offsetHeight)
    }

    function clearTimeUpdateInterval(instance) {
        instance.timeUpdateInterval && clearInterval(instance.timeUpdateInterval), instance.timeUpdateInterval = null
    }

    function onEndedInternal(instance) {
        clearTimeUpdateInterval(instance);
        var resizeListener = instance.resizeListener;
        resizeListener && (window.removeEventListener("resize", resizeListener), window.removeEventListener("orientationChange", resizeListener), instance.resizeListener = null);
        var stopInfo = {
            src: instance._currentSrc
        };
        events.trigger(instance, "stopped", [stopInfo]), instance._currentSrc = null, instance.currentYoutubePlayer && instance.currentYoutubePlayer.destroy(), instance.currentYoutubePlayer = null
    }

    function onPlayerReady(event) {
        event.target.playVideo()
    }

    function onTimeUpdate(e) {
        events.trigger(this, "timeupdate")
    }

    function onPlaying(instance, playOptions, resolve) {
        instance.started || (instance.started = !0, resolve(), clearTimeUpdateInterval(instance), instance.timeUpdateInterval = setInterval(onTimeUpdate.bind(instance), 500), playOptions.fullscreen ? appRouter.showVideoOsd().then(function() {
            instance.videoDialog.classList.remove("onTop")
        }) : (appRouter.setTransparency("backdrop"), instance.videoDialog.classList.remove("onTop")), require(["loading"], function(loading) {
            loading.hide()
        }))
    }

    function setCurrentSrc(instance, elem, options) {
        return new Promise(function(resolve, reject) {
            require(["queryString"], function(queryString) {
                instance._currentSrc = options.url;
                var params = queryString.parse(options.url.split("?")[1]);
                if (window.onYouTubeIframeAPIReady = function() {
                        instance.currentYoutubePlayer = new YT.Player("player", {
                            height: instance.videoDialog.offsetHeight,
                            width: instance.videoDialog.offsetWidth,
                            videoId: params.v,
                            events: {
                                onReady: onPlayerReady,
                                onStateChange: function(event) {
                                    event.data === YT.PlayerState.PLAYING ? onPlaying(instance, options, resolve) : event.data === YT.PlayerState.ENDED ? onEndedInternal(instance) : event.data === YT.PlayerState.PAUSED && events.trigger(instance, "pause")
                                }
                            },
                            playerVars: {
                                controls: 0,
                                enablejsapi: 1,
                                modestbranding: 1,
                                rel: 0,
                                showinfo: 0,
                                fs: 0,
                                playsinline: 1
                            }
                        });
                        var resizeListener = instance.resizeListener;
                        resizeListener ? (window.removeEventListener("resize", resizeListener), window.addEventListener("resize", resizeListener)) : (resizeListener = instance.resizeListener = onVideoResize.bind(instance), window.addEventListener("resize", resizeListener)), window.removeEventListener("orientationChange", resizeListener), window.addEventListener("orientationChange", resizeListener)
                    }, window.YT) window.onYouTubeIframeAPIReady();
                else {
                    var tag = document.createElement("script");
                    tag.src = "https://www.youtube.com/iframe_api";
                    var firstScriptTag = document.getElementsByTagName("script")[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
                }
            })
        })
    }

    function YoutubePlayer() {
        this.name = "Youtube Player", this.type = "mediaplayer", this.id = "youtubeplayer", this.priority = 1
    }
    return YoutubePlayer.prototype.play = function(options) {
        this.started = !1;
        var instance = this;
        return createMediaElement(this, options).then(function(elem) {
            return setCurrentSrc(instance, elem, options)
        })
    }, YoutubePlayer.prototype.stop = function(destroyPlayer) {
        return this._currentSrc && (this.currentYoutubePlayer && this.currentYoutubePlayer.stopVideo(), onEndedInternal(this), destroyPlayer && this.destroy()), Promise.resolve()
    }, YoutubePlayer.prototype.destroy = function() {
        appRouter.setTransparency("none");
        var dlg = this.videoDialog;
        dlg && (this.videoDialog = null, dlg.parentNode.removeChild(dlg))
    }, YoutubePlayer.prototype.canPlayMediaType = function(mediaType) {
        return "audio" === (mediaType = (mediaType || "").toLowerCase()) || "video" === mediaType
    }, YoutubePlayer.prototype.canPlayItem = function(item) {
        return !1
    }, YoutubePlayer.prototype.canPlayUrl = function(url) {
        return -1 !== url.toLowerCase().indexOf("youtube.com")
    }, YoutubePlayer.prototype.getDeviceProfile = function() {
        return Promise.resolve({})
    }, YoutubePlayer.prototype.currentSrc = function() {
        return this._currentSrc
    }, YoutubePlayer.prototype.setSubtitleStreamIndex = function(index) {}, YoutubePlayer.prototype.canSetAudioStreamIndex = function() {
        return !1
    }, YoutubePlayer.prototype.setAudioStreamIndex = function(index) {}, YoutubePlayer.prototype.currentTime = function(val) {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        if (currentYoutubePlayer) return null != val ? void currentYoutubePlayer.seekTo(val / 1e3, !0) : 1e3 * currentYoutubePlayer.getCurrentTime()
    }, YoutubePlayer.prototype.duration = function(val) {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        return currentYoutubePlayer ? 1e3 * currentYoutubePlayer.getDuration() : null
    }, YoutubePlayer.prototype.pause = function() {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        if (currentYoutubePlayer) {
            currentYoutubePlayer.pauseVideo();
            var instance = this;
            setTimeout(function() {
                events.trigger(instance, "pause")
            }, 200)
        }
    }, YoutubePlayer.prototype.unpause = function() {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        if (currentYoutubePlayer) {
            currentYoutubePlayer.playVideo();
            var instance = this;
            setTimeout(function() {
                events.trigger(instance, "unpause")
            }, 200)
        }
    }, YoutubePlayer.prototype.paused = function() {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        return !!currentYoutubePlayer && 2 === currentYoutubePlayer.getPlayerState()
    }, YoutubePlayer.prototype.volume = function(val) {
        return null != val ? this.setVolume(val) : this.getVolume()
    }, YoutubePlayer.prototype.setVolume = function(val) {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        currentYoutubePlayer && null != val && currentYoutubePlayer.setVolume(val)
    }, YoutubePlayer.prototype.getVolume = function() {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        if (currentYoutubePlayer) return currentYoutubePlayer.getVolume()
    }, YoutubePlayer.prototype.setMute = function(mute) {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        mute ? currentYoutubePlayer && currentYoutubePlayer.mute() : currentYoutubePlayer && currentYoutubePlayer.unMute()
    }, YoutubePlayer.prototype.isMuted = function() {
        var currentYoutubePlayer = this.currentYoutubePlayer;
        if (currentYoutubePlayer) return currentYoutubePlayer.isMuted()
    }, YoutubePlayer
});