/* Araras que voam com a rolagem.
   A seção é alta e o "palco" fica preso (sticky) na tela; a posição da rolagem
   escolhe o quadro do vídeo desenhado no canvas. Quadros em assets/araras/d (PC)
   e assets/araras/m (celular), carregados só quando a seção se aproxima:
   primeiro 1 a cada 8, depois 1 a cada 4, 2 e todos. */
(function () {
  "use strict";

  var section = document.getElementById("araras");
  if (!section) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // fica a foto parada

  var stage = section.querySelector(".araras-stage");
  var canvas = section.querySelector(".araras-canvas");
  var ctx = canvas.getContext("2d");
  var total = parseInt(section.getAttribute("data-frames"), 10) || 94;
  var dir = window.innerWidth < 760 ? "m" : "d";
  var frames = new Array(total);
  var current = -1;
  var started = false;
  var ticking = false;

  section.classList.add("is-scrub");

  function src(i) {
    var n = String(i + 1);
    while (n.length < 3) n = "0" + n;
    return "assets/araras/" + dir + "/" + n + ".webp";
  }

  function load(i) {
    if (frames[i]) return Promise.resolve();
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = "async";
      img.onload = function () { frames[i] = img; resolve(); if (current === -1 || Math.abs(i - target()) < Math.abs(current - target())) requestDraw(); };
      img.onerror = function () { resolve(); };
      img.src = src(i);
    });
  }

  // carrega em passes cada vez mais finos, 4 imagens por vez
  function loadAll() {
    var order = [];
    var seen = {};
    [8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < total; i += step) {
        if (!seen[i]) { seen[i] = 1; order.push(i); }
      }
    });
    if (!seen[total - 1]) order.splice(1, 0, total - 1);
    var k = 0;
    function next() {
      if (k >= order.length) return;
      var i = order[k++];
      load(i).then(next);
    }
    for (var c = 0; c < 4; c++) next();
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var run = section.offsetHeight - stage.offsetHeight;
    if (run <= 0) return 0;
    var p = -r.top / run;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // 0–6%: araras paradas; 6–92%: bicada + voo; final segura o galho vazio
  function target() {
    var p = progress();
    var t = (p - 0.06) / 0.86;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.round(t * (total - 1));
  }

  function nearestLoaded(i) {
    for (var d = 0; d < total; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    current = -1;
  }

  function draw() {
    ticking = false;
    var p = progress();
    var i = nearestLoaded(target());
    if (i < 0) return;
    // leve aproximação da câmera durante o voo: reforça a sensação de 3D
    var push = p < 0.35 ? 0 : (p - 0.35) / 0.65;
    var scale = 1 + Math.min(push, 1) * 0.12;
    canvas.style.transform = "scale(" + scale.toFixed(4) + ")";
    if (i === current) return;
    var img = frames[i];
    var cw = canvas.width, ch = canvas.height;
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    current = i;
    if (!section.classList.contains("is-ready")) section.classList.add("is-ready");
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
        sizeCanvas();
        loadAll();
      }
    });
  }, { rootMargin: "150% 0px 150% 0px" });
  io.observe(section);

  window.addEventListener("scroll", function () { if (started) requestDraw(); }, { passive: true });
  window.addEventListener("resize", function () { if (started) { sizeCanvas(); requestDraw(); } });
})();
