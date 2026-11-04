/* Araras: o vídeo original roda sozinho quando a seção aparece na tela.
   - carrega o vídeo só quando a seção se aproxima (versão de celular ou de PC);
   - com 60% da seção visível, volta ao início e toca uma vez, parando no último quadro;
   - se a pessoa sair da seção e voltar, toca de novo. */
(function () {
  "use strict";

  var section = document.getElementById("araras");
  if (!section) return;
  var video = section.querySelector("video");
  if (!video || !("IntersectionObserver" in window)) return;

  var mobile = window.matchMedia("(max-width: 759px)").matches;
  if (mobile) video.poster = video.getAttribute("data-poster-mobile");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var loaded = false;
  var played = false;

  function load() {
    if (loaded) return;
    loaded = true;
    video.src = video.getAttribute(mobile ? "data-src-mobile" : "data-src-desktop");
    video.preload = "auto";
    video.load();
  }

  function play() {
    load();
    if (played || reduce) return;
    played = true;
    try { video.currentTime = 0; } catch (e) {}
    var p = video.play();
    if (p && p.catch) p.catch(function () { played = false; });
  }

  // começa a baixar um pouco antes de chegar
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) load();
  }, { rootMargin: "100% 0px" }).observe(section);

  // toca quando a maior parte da seção está na tela; libera para tocar de novo ao sair
  new IntersectionObserver(function (entries) {
    var e = entries[0];
    if (e.intersectionRatio >= 0.6) play();
    else if (e.intersectionRatio === 0) played = false;
  }, { threshold: [0, 0.6] }).observe(section);
})();
