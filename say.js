/* 生词/例句发音：优先播放预生成的 mp3（audio/words/），缺文件时回退系统语音。
   词表索引 data/words-audio.js 改为空闲时预热，不占首屏请求。 */
(function () {
  var BASE = window.SAY_BASE || "audio/words/";
  var MAP_SRC = window.SAY_MAP || "data/words-audio.js";
  var cur = null;
  var curBtn = null;
  var mapPromise = null;

  function ensureMap(cb) {
    if (window.WORD_AUDIO) { cb(); return; }
    if (!mapPromise) {
      mapPromise = new Promise(function (res) {
        var s = document.createElement("script");
        s.src = MAP_SRC;
        s.onload = res;
        s.onerror = res;
        document.head.appendChild(s);
      });
    }
    mapPromise.then(cb);
  }

  function stop() {
    if (cur) {
      try { cur.pause(); } catch (e) {}
      cur = null;
    }
    if (curBtn) { curBtn.classList.remove("playing"); curBtn = null; }
  }

  function clean(t) {
    return String(t || "").replace(/[！？。，、；：""''（）—\s]/g, "");
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(clean(text));
      u.lang = "zh-CN";
      u.rate = 0.8;
      var v = window.speechSynthesis.getVoices().filter(function (x) { return /zh[-_]CN/i.test(x.lang); })[0];
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function play(raw, btn) {
    var t = String(raw || "").trim();
    if (!window.WORD_AUDIO) {
      ensureMap(function () { play(raw, btn); });
      return;
    }
    var map = window.WORD_AUDIO;
    var file = map[t];
    if (!file) {
      var alt = t.replace(/[（(][^）)]*[）)]/g, "").trim();
      file = map[alt];
    }
    stop();
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (!file) { speak(t); return; }
    var a = new Audio(BASE + file);
    cur = a;
    curBtn = btn || null;
    if (btn) btn.classList.add("playing");
    a.onended = function () { stop(); };
    a.onerror = function () { stop(); speak(t); };
    var p = a.play();
    if (p && p.catch) p.catch(function () { stop(); speak(t); });
  }

  window.SAY = { play: play, speak: speak, stop: stop, warm: function () { ensureMap(function () {}); } };

  function warm() { ensureMap(function () {}); }
  function startWarm() {
    if (window.requestIdleCallback) {
      try { window.requestIdleCallback(warm, { timeout: 1200 }); } catch (e) { setTimeout(warm, 400); }
    }
    setTimeout(warm, 400);
  }
  if (document.readyState === "complete") startWarm();
  else window.addEventListener("load", startWarm);
})();
