/* Araras que voam com a rolagem, saindo da tela.
   Duas camadas desenhadas em canvas, escolhidas pela posição da rolagem:
   - fundo (assets/araras/d|m): cena com o filtro azul por cima (scrim);
   - araras recortadas (assets/araras/bd|bm): ficam POR CIMA do filtro.
   Enquanto pousadas, as araras recebem o mesmo tom azul do filtro; quando
   decolam, o tom some e a camada cresce e sobe, como se saíssem da tela.
   Os quadros só carregam quando a seção se aproxima. */
(function () {
  "use strict";

  var section = document.getElementById("araras");
  if (!section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var stage = section.querySelector(".araras-stage");
  var bgCanvas = section.querySelector(".araras-canvas");
  var birdCanvas = section.querySelector(".araras-birds");
  var bgCtx = bgCanvas.getContext("2d");
  var birdCtx = birdCanvas.getContext("2d");

  var total = parseInt(section.getAttribute("data-frames"), 10) || 94;
  var birdFirst = parseInt(section.getAttribute("data-bird-first"), 10) - 1; // índice 0
  var birdLast = parseInt(section.getAttribute("data-bird-last"), 10) - 1;
  var mobile = window.innerWidth < 760;
  var bgDir = mobile ? "m" : "d";
  var birdDir = mobile ? "bm" : "bd";

  var bg = new Array(total), birds = new Array(total);
  var currentBg = -1, currentBird = -2, lastTint = -1;
  var started = false, ticking = false;

  // tom do filtro (mesmo do .photo-cta__scrim)
  var SCRIM = [[0, 0.35], [0.5, 0.15], [1, 0.4]];

  section.classList.add("is-scrub");

  function name(i) {
    var n = String(i + 1);
    while (n.length < 3) n = "0" + n;
    return n + ".webp";
  }

  function loadImg(list, dir, i) {
    if (list[i]) return Promise.resolve();
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = "async";
      img.onload = function () { list[i] = img; resolve(); requestDraw(); };
      img.onerror = function () { resolve(); };
      img.src = "assets/araras/" + dir + "/" + name(i);
    });
  }

  function loadAll() {
    var jobs = [], seen = {};
    [8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < total; i += step) {
        if (seen[i]) continue;
        seen[i] = 1;
        jobs.push([bg, bgDir, i]);
        if (i >= birdFirst && i <= birdLast) jobs.push([birds, birdDir, i]);
      }
    });
    var k = 0;
    function next() {
      if (k >= jobs.length) return;
      var j = jobs[k++];
      loadImg(j[0], j[1], j[2]).then(next);
    }
    for (var c = 0; c < 5; c++) next();
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var run = section.offsetHeight - stage.offsetHeight;
    if (run <= 0) return 0;
    var p = -r.top / run;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // 0–5%: pousadas; 5–90%: bicada + voo; final segura o galho vazio
  function frameAt(p) {
    var t = (p - 0.05) / 0.85;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.round(t * (total - 1));
  }

  function nearest(list, i, lo, hi) {
    for (var d = 0; d < total; d++) {
      if (i - d >= lo && list[i - d]) return i - d;
      if (i + d <= hi && list[i + d]) return i + d;
    }
    return -1;
  }

  function sizeCanvases() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = stage.clientWidth, h = stage.clientHeight;
    [bgCanvas, birdCanvas].forEach(function (c) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    });
    currentBg = -1; currentBird = -2;
  }

  function cover(ctx, img) {
    var cw = ctx.canvas.width, ch = ctx.canvas.height;
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function draw() {
    ticking = false;
    var f = frameAt(progress());

    // ---- fundo ----
    var bi = nearest(bg, f, 0, total - 1);
    if (bi >= 0 && bi !== currentBg) {
      cover(bgCtx, bg[bi]);
      currentBg = bi;
      section.classList.add("is-ready");
    }

    // ---- araras por cima do filtro ----
    // tint: 1 = mesmo tom azul do fundo (pousadas); 0 = cor viva (voando)
    var tint = 1 - clamp01((f - (birdFirst + 3)) / 10);
    // pop: 0 = no lugar; 1 = bem maiores e mais altas, "saindo" da tela
    var pop = clamp01((f - (birdFirst + 16)) / 20);
    pop = pop * pop * (3 - 2 * pop);

    var wi = (f >= birdFirst && f <= birdLast) ? nearest(birds, f, birdFirst, birdLast) : -1;
    if (wi !== currentBird || Math.abs(tint - lastTint) > 0.01) {
      birdCtx.clearRect(0, 0, birdCanvas.width, birdCanvas.height);
      if (wi >= 0) {
        cover(birdCtx, birds[wi]);
        if (tint > 0.01) {
          var g = birdCtx.createLinearGradient(0, 0, 0, birdCanvas.height);
          SCRIM.forEach(function (s) { g.addColorStop(s[0], "rgba(1,31,92," + (s[1] * tint).toFixed(3) + ")"); });
          birdCtx.globalCompositeOperation = "source-atop";
          birdCtx.fillStyle = g;
          birdCtx.fillRect(0, 0, birdCanvas.width, birdCanvas.height);
          birdCtx.globalCompositeOperation = "source-over";
        }
      }
      currentBird = wi;
      lastTint = tint;
    }
    var scale = 1 + pop * (mobile ? 0.9 : 1.15);
    var lift = pop * (mobile ? -14 : -10);
    birdCanvas.style.transform = "translate3d(0," + lift.toFixed(2) + "%,0) scale(" + scale.toFixed(4) + ")";
    if (!mobile) {
      birdCanvas.style.filter = pop > 0.02
        ? "drop-shadow(0 " + Math.round(30 * pop) + "px " + Math.round(36 * pop) + "px rgba(0,0,0," + (0.4 * pop).toFixed(2) + "))"
        : "none";
    }
  }

  function requestDraw() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(draw);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !started) {
        started = true;
        sizeCanvases();
        loadAll();
      }
    });
  }, { rootMargin: "150% 0px 150% 0px" });
  io.observe(section);

  window.addEventListener("scroll", function () { if (started) requestDraw(); }, { passive: true });
  window.addEventListener("resize", function () { if (started) { sizeCanvases(); requestDraw(); } });
})();
