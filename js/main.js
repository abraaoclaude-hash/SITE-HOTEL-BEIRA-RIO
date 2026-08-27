/* Hotel Beira Rio — simple site behaviours
   - nav: solid background + shrink after scrolling, mobile menu toggle
   - scroll-reveal: fade/slide elements into view via IntersectionObserver
   No pinned/growing-card scroll hijacking — kept intentionally simple. */

(function () {
  "use strict";

  // ---- nav scroll state ----
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- mobile nav toggle ----
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- scroll reveal ----
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- booking form (placeholder until a real booking engine is integrated) ----
  // No reservation system is connected yet: submitting simply builds a WhatsApp
  // link (optionally including the chosen dates) and opens it in a new tab.
  var bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var checkin = document.getElementById("checkin").value;
      var checkout = document.getElementById("checkout").value;
      var msg = "Olá! Gostaria de verificar disponibilidade no Hotel Beira Rio.";
      if (checkin) msg += " Check-in: " + checkin + ".";
      if (checkout) msg += " Check-out: " + checkout + ".";
      var url = "https://wa.me/5567993409398?text=" + encodeURIComponent(msg);
      window.open(url, "_blank", "noopener");
    });
  }

  // ---- lightbox (galeria: clique numa foto pra ver ela inteira) ----
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var lightboxTriggers = Array.prototype.slice.call(document.querySelectorAll(".js-lightbox img"));

  if (lightbox && lightboxTriggers.length) {
    var currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      var img = lightboxTriggers[currentIndex];
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function showNext() { openLightbox((currentIndex + 1) % lightboxTriggers.length); }
    function showPrev() { openLightbox((currentIndex - 1 + lightboxTriggers.length) % lightboxTriggers.length); }

    lightboxTriggers.forEach(function (img, index) {
      img.addEventListener("click", function () { openLightbox(index); });
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxNext.addEventListener("click", showNext);
    lightboxPrev.addEventListener("click", showPrev);

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });
  }
})();
