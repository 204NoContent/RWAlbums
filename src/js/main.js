import Auth from './auth.js';

var _this = void 0;

var indexSong = 0;
var isLocked = false;
var songsLength = null;
var selectedSong = null;
var songIsPlayed = false;
var progress_elmnt = null;
var songName_elmnt = null;
var sliderImgs_elmnt = null;
var singerName_elmnt = null;
var progressBar_elmnt = null;
var playlistSongs_elmnt = [];
var musicPlayerInfo_elmnt = null;
var progressBarIsUpdating = false;
var broadcastGuarantor_elmnt = null;

function App(_ref) {
  var songs = _ref.songs;

  function handleChangeMusic(_ref2) {
    var _ref2$isPrev = _ref2.isPrev,
      isPrev = _ref2$isPrev === void 0 ? false : _ref2$isPrev,
      _ref2$playListIndex = _ref2.playListIndex,
      playListIndex = _ref2$playListIndex === void 0 ? null : _ref2$playListIndex;
    if (isLocked || indexSong === playListIndex) return;

    if (playListIndex || playListIndex === 0) {
      indexSong = playListIndex;
    } else {
      indexSong = isPrev ? indexSong -= 1 : indexSong += 1;
    }

    if (indexSong < 0) {
      indexSong = 0;
      return;
    } else if (indexSong > songsLength) {
      indexSong = songsLength;
      return;
    }

    selectedSong.pause();
    selectedSong.currentTime = 0;
    progressBarIsUpdating = false;
    selectedSong = playlistSongs_elmnt[indexSong];
    setBodyBg(songs[indexSong].bg);
    setProperty(sliderImgs_elmnt, "--index", -indexSong);
    updateInfo(singerName_elmnt, songs[indexSong].artist);
    updateInfo(songName_elmnt, songs[indexSong].songName);

    // begin mods
    broadcastGuarantor_elmnt.classList.remove("click");
    Auth.isAuthorized(songs, indexSong, (error) => {
      if (error) return console.error(error);
      broadcastGuarantor_elmnt.classList.add("click");
      selectedSong.play();
    });
    // end mods
  }

  setBodyBg(songs[0].bg);
  return dom("div", {
    "class": "music-player flex-column"
  }, dom(Slider, {
    slides: songs,
    handleChangeMusic: handleChangeMusic
  }), dom(Playlist, {
    list: songs,
    handleChangeMusic: handleChangeMusic
  }));
}

fetch("../data.json").then(function (respone) {
  return respone;
}).then(function (data) {
  return data.json();
}).then(function (result) {
  var songs = result.songs;

  function downloadTheFiles(media, input) {
    return Promise.all(input.map(function (song) {
      return new Promise(function (resolve) {
        var url = song.files[media];
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "blob";
        req.send();

        req.onreadystatechange = function () {
          if (req.readyState === 4) {
            if (req.status === 200) {
              var blob = req.response;
              var file = URL.createObjectURL(blob);
              song.files[media] = file;
              resolve(song);
            }
          }
        };
      });
    }));
  }

  downloadTheFiles("cover", songs).then(function (respone) {
    downloadTheFiles("song", respone).then(function (data) {
      querySelector("#root").appendChild(dom(App, {
        songs: data
      }));
      songsLength = data.length - 1;
      progress_elmnt = querySelector(".progress");
      playlistSongs_elmnt = querySelectorAll("audio");
      sliderImgs_elmnt = querySelector(".slider__imgs");
      songName_elmnt = querySelector(".music-player__subtitle");
      musicPlayerInfo_elmnt = querySelector(".music-player__info");
      singerName_elmnt = querySelector(".music-player__singer-name");
      selectedSong = playlistSongs_elmnt[indexSong];
      progressBar_elmnt = querySelector(".progress__bar");
      broadcastGuarantor_elmnt = querySelector(".music-player__broadcast-guarantor");
      controlSubtitleAnimation(musicPlayerInfo_elmnt, songName_elmnt);
      controlSubtitleAnimation(musicPlayerInfo_elmnt, singerName_elmnt);
    });
  });
});

function controlSubtitleAnimation(parent, child) {
  if (child.classList.contains("animate")) return;
  var element = child.firstChild;

  if (child.clientWidth > parent.clientWidth) {
    child.appendChild(element.cloneNode(true));
    child.classList.add("animate");
  }

  setProperty(child.parentElement, "width", "".concat(element.clientWidth, "px"));
}

function handleResize() {
  var vH = window.innerHeight * 0.01;
  setProperty(document.documentElement, "--vH", "".concat(vH, "px"));
}

function querySelector(target) {
  return document.querySelector(target);
}

function querySelectorAll(target) {
  return document.querySelectorAll(target);
}

function setProperty(target, prop) {
  var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  target.style.setProperty(prop, value);
}

function setBodyBg(color) {
  setProperty(document.body, "--body-bg", color);
}

function updateInfo(target, value) {
  while (target.firstChild) {
    target.removeChild(target.firstChild);
  }

  var targetChild_elmnt = document.createElement("div");
  targetChild_elmnt.appendChild(document.createTextNode(value));
  target.appendChild(targetChild_elmnt);
  target.classList.remove("animate");
  controlSubtitleAnimation(musicPlayerInfo_elmnt, target);
}

function handleScrub(e) {
  var progressOffsetLeft = progress_elmnt.getBoundingClientRect().left;
  var progressWidth = progress_elmnt.offsetWidth;
  var duration = selectedSong.duration;
  var currentTime = (e.clientX - progressOffsetLeft) / progressWidth;
  selectedSong.currentTime = currentTime * duration;
}

handleResize();
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);
window.addEventListener("transitionstart", function (_ref3) {
  var target = _ref3.target;

  if (target === sliderImgs_elmnt) {
    isLocked = true;
    setProperty(sliderImgs_elmnt, "will-change", "transform");
  }
});
window.addEventListener("transitionend", function (_ref4) {
  var target = _ref4.target,
    propertyName = _ref4.propertyName;

  if (target === sliderImgs_elmnt) {
    isLocked = false;
    setProperty(sliderImgs_elmnt, "will-change", "auto");
  }

  if (target.classList.contains("slider") && propertyName === "height") {
    controlSubtitleAnimation(musicPlayerInfo_elmnt, songName_elmnt);
    controlSubtitleAnimation(musicPlayerInfo_elmnt, singerName_elmnt);
  }
});
window.addEventListener("pointerup", function () {
  if (progressBarIsUpdating) {
    selectedSong.muted = false;
    progressBarIsUpdating = false;
  }
});
window.addEventListener("pointermove", function (e) {
  if (progressBarIsUpdating) {
    handleScrub(e, _this);
    selectedSong.muted = true;
  }
});

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function dom(tag, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  if (typeof tag === "function") return tag.apply(void 0, [props].concat(children));

  function addChild(parent, child) {
    if (Array.isArray(child)) {
      child.forEach(function (nestedChild) {
        return addChild(parent, nestedChild);
      });
    } else {
      parent.appendChild(child.nodeType ? child : document.createTextNode(child.toString()));
    }
  }

  var element = document.createElement(tag);
  Object.entries(props || {}).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      name = _ref2[0],
      value = _ref2[1];

    if (name.startsWith("on") && name.toLowerCase() in window) {
      element[name.toLowerCase()] = value;
    } else if (name === "style") {
      Object.entries(value).forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          styleProp = _ref4[0],
          styleValue = _ref4[1];

        element.style[styleProp] = styleValue;
      });
    } else {
      element.setAttribute(name, value.toString());
    }
  });
  children.forEach(function (child) {
    addChild(element, child);
  });
  return element;
}

function Playlist(_ref) {
  var list = _ref.list,
    handleChangeMusic = _ref.handleChangeMusic;

  function loadedAudio() {
    var duration = this.duration;
    var target = this.parentElement.querySelector(".music-player__song-duration");
    var min = parseInt(duration / 60);
    if (min < 10) min = "0" + min;
    var sec = parseInt(duration % 60);
    if (sec < 10) sec = "0" + sec;
    target.appendChild(document.createTextNode("".concat(min, ":").concat(sec)));
  }

  function timeupdate() {
    var duration = this.duration;
    var currentTime = this.currentTime;
    var progressBarWidth = currentTime / duration * 100;
    setProperty(progressBar_elmnt, "--width", "".concat(progressBarWidth, "%"));

    if (songIsPlayed && currentTime === duration) {
      handleChangeMusic({});
    }

    if (indexSong === songsLength && this === selectedSong && currentTime === duration) {
      songIsPlayed = false;
      broadcastGuarantor_elmnt.classList.remove("click");
    }
  }

  return dom("ul", {
    "class": "music-player__playlist list"
  }, list.map(function (_ref2, index) {
    var songName = _ref2.songName,
      artist = _ref2.artist,
      _ref2$files = _ref2.files,
      cover = _ref2$files.cover,
      song = _ref2$files.song;
    return dom("li", {
      "class": "music-player__song",
      onClick: function onClick() {
        return handleChangeMusic({
          isPrev: false,
          playListIndex: index
        });
      }
    }, dom("div", {
      "class": "flex-row _align_center"
    }, dom("img", {
      src: cover,
      "class": "img music-player__song-img"
    }), dom("div", {
      "class": "music-player__playlist-info  text_trsf-cap"
    }, dom("b", {
      "class": "text_overflow"
    }, songName), dom("div", {
      "class": "flex-row _justify_space-btwn"
    }, dom("span", {
      "class": "music-player__subtitle"
    }, artist), dom("span", {
      "class": "music-player__song-duration"
    })))), dom("audio", {
      src: song,
      onTimeupdate: timeupdate,
      onLoadeddata: loadedAudio
    }));
  }));
}

function Slider(_ref) {
  var slides = _ref.slides,
    handleChangeMusic = _ref.handleChangeMusic;

  function handleResizeSlider(_ref2) {
    var target = _ref2.target;

    if (isLocked) {
      return;
    } else if (target.classList.contains("music-player__info")) {
      this.classList.add("resize");
      setProperty(this, "--controls-animate", "down running");
      return;
    } else if (target.classList.contains("music-player__playlist-button")) {
      this.classList.remove("resize");
      setProperty(this, "--controls-animate", "up running");
      return;
    }
  }

  function handlePlayMusic() {
    if (selectedSong.currentTime === selectedSong.duration) {
      handleChangeMusic({});
    }
    // begin mods
    let continuePlay = (error) => {
      if (error) return console.error(error);
      this.classList.toggle("click");
      songIsPlayed = !songIsPlayed;
      selectedSong.paused ? selectedSong.play() : selectedSong.pause();
    }

    if (selectedSong.paused) {
      Auth.isAuthorized(slides, indexSong, continuePlay);
    } else {
      continuePlay(null);
    }
    // end mods


  }

  return dom("div", {
    "class": "slider center",
    onClick: handleResizeSlider
  }, dom("div", {
    "class": "slider__content center"
  }, dom("button", {
    "class": "music-player__playlist-button center button"
  }, dom("i", {
    "class": "icon-playlist"
  })), dom("button", {
    onClick: handlePlayMusic,
    "class": "music-player__broadcast-guarantor center button"
  }, dom("i", {
    "class": "icon-play"
  }), dom("i", {
    "class": "icon-pause"
  })), dom("div", {
    "class": "slider__imgs flex-row"
  }, slides.map(function (_ref3) {
    var songName = _ref3.songName,
      cover = _ref3.files.cover;
    return dom("img", {
      src: cover,
      "class": "img",
      alt: songName
    });
  }))), dom("div", {
    "class": "slider__controls center"
  }, dom("button", {
    "class": "slider__switch-button flex-row button",
    onClick: function onClick() {
      return handleChangeMusic({
        isPrev: true
      });
    }
  }, dom("i", {
    "class": "icon-back"
  })), dom("div", {
    "class": "music-player__info text_trsf-cap"
  }, dom("div", null, dom("div", {
    "class": "music-player__singer-name"
  }, dom("div", null, slides[0].artist))), dom("div", null, dom("div", {
    "class": "music-player__subtitle"
  }, dom("div", null, slides[0].songName)))), dom("button", {
    "class": "slider__switch-button flex-row button",
    onClick: function onClick() {
      return handleChangeMusic({
        isPrev: false
      });
    }
  }, dom("i", {
    "class": "icon-next"
  })), dom("div", {
    "class": "progress center",
    onPointerdown: function onPointerdown(e) {
      handleScrub(e);
      progressBarIsUpdating = true;
    }
  }, dom("div", {
    "class": "progress__wrapper"
  }, dom("div", {
    "class": "progress__bar center"
  })))));
}

