/* Dinamoweb · home v2 "Una giornata in azienda" */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement, body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var motion = hasGsap && !reduce;

  root.classList.add("js-sky");
  if (motion) root.classList.add("js-motion");
  body.setAttribute("data-sky", "alba");

  /* Menu mobile */
  var nav = $("#nav"), toggle = $("#menu-toggle");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Chiudi" : "Menu";
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu"; }); });

  /* Secondi dell'orologio in apertura */
  var sec = $("#hero-sec");
  if (sec && !reduce) setInterval(function () { var s = new Date().getSeconds(); sec.textContent = ":" + (s < 10 ? "0" : "") + s; }, 1000);

  /* Scroll morbido */
  var lenis = null;
  if (motion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var el = id === "#top" ? 0 : $(id); if (el === null) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: id === "#top" ? 0 : -72, duration: 1.4 });
      });
    });
  }

  /* Cielo e orologio della giornata */
  var skies = $$("main [data-sky]");
  var scenes = $$("#giornata .scene");
  var giornata = $("#giornata");
  var clock = $("#dayclock"), dcTime = $("#dc-time"), dcFill = $("#dc-fill"), dcSun = $("#dc-sun"), dcLabel = $("#dc-label");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var skyColor = { alba: "#F3F2EE", mattina: "#ECF0F1", mezzogiorno: "#F6F2E6", pomeriggio: "#F2E7D6", sera: "#E4CBB1", notte: "#0F1219" };
  var anchors = [];
  function toMin(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function pageTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function measure() {
    anchors = scenes.map(function (s) { return { y: pageTop(s) - window.innerHeight * 0.45, m: toMin(s.dataset.time) }; });
  }
  function fmt(m) { m = Math.round(m); var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
  function label(m) {
    if (m < 13 * 60) return "mattina";
    if (m < 14 * 60) return "pausa pranzo";
    if (m < 18 * 60) return "pomeriggio";
    if (m < 19 * 60) return "chiusura";
    return "fuori orario";
  }
  var currentSky = "alba";
  function update() {
    var y = window.pageYOffset, vh = window.innerHeight;
    /* cielo: la sezione che occupa il centro dello schermo */
    var sky = currentSky;
    for (var i = 0; i < skies.length; i++) {
      var r = skies[i].getBoundingClientRect();
      if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) { sky = skies[i].dataset.sky; break; }
    }
    if (y < 10) sky = "alba";
    if (sky !== currentSky) {
      currentSky = sky; body.setAttribute("data-sky", sky);
      if (themeMeta) themeMeta.setAttribute("content", skyColor[sky] || "#F3F2EE");
    }
    /* orologio */
    if (!anchors.length) return;
    var g = giornata.getBoundingClientRect();
    clock.classList.toggle("on", g.top < vh * 0.55 && g.bottom > vh * 0.6);
    var m = anchors[0].m;
    if (y >= anchors[anchors.length - 1].y) m = anchors[anchors.length - 1].m;
    else for (var k = 0; k < anchors.length - 1; k++) {
      var a = anchors[k], b = anchors[k + 1];
      if (y >= a.y && y < b.y) { m = a.m + (b.m - a.m) * ((y - a.y) / (b.y - a.y)); break; }
    }
    dcTime.textContent = fmt(m);
    dcLabel.textContent = label(m);
    var p = Math.max(0, Math.min(1, (m - 540) / 540));
    dcFill.style.width = (p * 100) + "%";
    dcSun.style.left = (p * 100) + "%";
  }
  measure(); update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", function () { measure(); update(); });
  window.addEventListener("load", function () { measure(); update(); });

  /* Contatori */
  function countUp(el) {
    var to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    var show = function (v) { el.textContent = v.toFixed(dec).replace(".", ","); };
    if (!motion) { show(to); return; }
    var o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: function () { show(o.v); } });
  }

  /* Ricerca che si scrive da sola */
  function typeIn(el) {
    var txt = el.dataset.type, i = 0;
    if (!motion) { el.textContent = txt; return; }
    (function step() { el.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(step, 38 + Math.random() * 50); })();
  }

  if (!motion) {
    $$("[data-count]").forEach(countUp);
    $$("[data-type]").forEach(typeIn);
  } else {
    gsap.registerPlugin(ScrollTrigger);

    /* Apertura */
    gsap.from(".hero-clock, .hero h1, .hero-foot, .signature, .hero .kicker", { opacity: 0, y: 30, duration: 1.1, ease: "power3.out", stagger: 0.09, delay: 0.1 });
    gsap.from(".hero-sun", { yPercent: 25, opacity: 0, duration: 2.2, ease: "power2.out" });
    gsap.to(".hero-sun", { yPercent: -22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* Le ore entrano scorrendo */
    $$(".scene-time").forEach(function (t) {
      gsap.from(t, { yPercent: 35, opacity: 0, ease: "none", scrollTrigger: { trigger: t, start: "top 95%", end: "top 55%", scrub: true } });
    });

    /* Testi e prove */
    $$(".scene").forEach(function (s) {
      var parts = $$(".scene-text > *, .scene-close h2, .tally li, .draft-note", s);
      gsap.from(parts, { opacity: 0, y: 26, duration: 0.9, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: s, start: "top 62%", once: true } });
      var proof = $(".proof", s);
      if (proof) gsap.from(proof, { opacity: 0, y: 50, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: proof, start: "top 85%", once: true } });
    });

    var onEnter = function (sel, fn, start) {
      $$(sel).forEach(function (el) { ScrollTrigger.create({ trigger: el, start: start || "top 75%", once: true, onEnter: function () { fn(el); } }); });
    };
    onEnter(".inbox", function (el) { gsap.from($$(".chip", el), { opacity: 0, x: 16, duration: 0.5, stagger: 0.28, delay: 0.3, ease: "power2.out" }); });
    onEnter("[data-type]", typeIn);
    onEnter(".serp, .ai-box", function (el) { gsap.from(el, { opacity: 0, y: 12, duration: 0.6, delay: 1.9, ease: "power2.out" }); });
    onEnter(".toast", function (el) { gsap.from(el, { opacity: 0, y: 20, scale: 0.94, duration: 0.6, delay: 0.7, ease: "back.out(1.6)" }); }, "top 90%");
    onEnter(".ticket", function (el) { gsap.from($$("li", el), { opacity: 0, x: -12, duration: 0.45, stagger: 0.35, delay: 0.2 }); });
    onEnter(".leads", function (el) { gsap.from($$("tbody tr", el), { opacity: 0, y: 10, duration: 0.45, stagger: 0.18, delay: 0.2 }); });
    onEnter(".shots", function (el) { gsap.from($$("li", el), { opacity: 0, duration: 0.4, stagger: 0.2, delay: 0.2 }); });
    onEnter(".bars", function (el) { gsap.from($$("i", el), { scaleY: 0, duration: 0.7, stagger: 0.07, ease: "power2.out" }); });
    onEnter(".chat", function (el) { gsap.from($$(".msg", el), { opacity: 0, y: 14, duration: 0.5, stagger: 0.9, delay: 0.3, ease: "power2.out" }); });
    onEnter("[data-count]", countUp, "top 88%");

    /* Blocchi finali */
    $$(".block").forEach(function (b) {
      gsap.from($$(".kicker, .big, .lead, .history li, .numbers li, .badges, .crafts li, .aside, .work, .more, .dist li, .steps li, .form", b), {
        opacity: 0, y: 26, duration: 0.9, ease: "power3.out", stagger: 0.06, scrollTrigger: { trigger: b, start: "top 68%", once: true }
      });
    });
    $$(".dist i").forEach(function (i) { gsap.from(i, { scaleX: 0, transformOrigin: "left", duration: 1, ease: "power2.out", scrollTrigger: { trigger: i, start: "top 90%", once: true } }); });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); measure(); update(); });
  }

  /* Modulo (bozza: nessun invio) */
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var form = $("#checkup-form"), status = $("#checkup-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var miss = [];
    if (!form.nome.value.trim()) miss.push("nome");
    if (!form.azienda.value.trim()) miss.push("azienda");
    if (!emailOk(form.email.value.trim())) miss.push("email valida");
    status.textContent = miss.length ? "Manca: " + miss.join(", ") + "." : "Bozza: il modulo non invia ancora dati. In produzione la richiesta arriverà al team commerciale.";
  });
})();
