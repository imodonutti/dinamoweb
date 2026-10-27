/* Dinamoweb · home v3 "Comunicare è emozionare" */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var motion = hasGsap && !reduce;
  if (motion) root.classList.add("js-motion");

  /* Menu mobile */
  var nav = $("#nav"), toggle = $("#menu-toggle");
  function closeMenu() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu"; }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Chiudi" : "Menu";
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", closeMenu); });

  /* Header pieno dopo l'apertura */
  var header = $(".site-header");
  function headerState() { header.classList.toggle("solid", window.pageYOffset > 40); }
  headerState(); window.addEventListener("scroll", headerState, { passive: true });

  /* ---------- Il video dell'apertura ----------
     Una ripresa di un bulbo che germoglia e sboccia, scomposta in 48
     fotogrammi: lo scroll ne è la testina di lettura, in avanti e
     all'indietro. Tra un fotogramma e l'altro c'è una dissolvenza, così il
     movimento resta fluido. */
  var canvas = $("#film"), ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1, mobile = false;
  var target = 0, shown = 0;
  var FRAMES = 48, BASE = "/assets/v3/video/seme/f", VER = "?v=202610271340";
  var imgs = new Array(FRAMES), ready = new Array(FRAMES);

  function clamp(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }
  function load(i) {
    if (imgs[i]) return;
    var im = new Image(); im.decoding = "async";
    im.onload = function () { ready[i] = true; kick(); };
    im.src = BASE + pad(i + 1) + ".webp" + VER; imgs[i] = im;
  }
  /* prima il fotogramma iniziale e quello finale, poi tutti gli altri */
  load(0); load(FRAMES - 1);
  function loadAll() { for (var i = 1; i < FRAMES - 1; i++) load(i); }
  if (document.readyState === "complete") loadAll(); else window.addEventListener("load", loadAll);

  function resize() {
    var rc = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingQuality = "high";
    mobile = W < 760;
  }
  function nearest(i) {
    if (ready[i]) return i;
    for (var d = 1; d < FRAMES; d++) {
      if (i - d >= 0 && ready[i - d]) return i - d;
      if (i + d < FRAMES && ready[i + d]) return i + d;
    }
    return -1;
  }

  /* riquadro dove disegnare il video: tutto schermo su desktop, metà alta su telefono */
  function box() {
    return mobile ? { x: 0, y: 56, w: W, h: Math.round(H * .5) } : { x: 0, y: 0, w: W, h: H };
  }
  function blit(im, b, alpha) {
    var iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(b.w / iw, b.h / ih);
    var dw = iw * s, dh = ih * s;
    /* la pianta sta al 75% della ripresa: la portiamo a destra del testo */
    var dx = Math.max(b.w - dw, Math.min(0, b.w * (mobile ? .6 : .72) - dw * .75));
    /* abbassiamo la ripresa: il fiore resta sotto il menu e la terra scende in fondo */
    var dy = (b.h - dh) * .6 + (mobile ? b.h * .1 : b.h * .11);
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, b.x + dx, b.y + dy, dw, dh);
    if (dy > 0) {
      /* sopra la ripresa: fondo crema che sfuma nel cielo sfocato */
      ctx.fillStyle = "#F6F0EA"; ctx.fillRect(b.x, b.y, b.w, dy + 1);
      var fz = ctx.createLinearGradient(0, b.y + dy, 0, b.y + dy + 90);
      fz.addColorStop(0, "rgba(246,240,234,1)"); fz.addColorStop(1, "rgba(246,240,234,0)");
      ctx.fillStyle = fz; ctx.fillRect(b.x, b.y + dy, b.w, 90);
    }
    ctx.globalAlpha = 1;
  }

  function draw(p) {
    if (W < 2 || H < 2) { resize(); if (W < 2 || H < 2) return; }
    ctx.fillStyle = "#F6F0EA"; ctx.fillRect(0, 0, W, H);
    var b = box(), pos = clamp(p) * (FRAMES - 1), i = Math.floor(pos), f = pos - i;
    var a = nearest(i);
    ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    if (a >= 0) {
      blit(imgs[a], b, 1);
      var j = Math.min(FRAMES - 1, i + 1);
      if (f > .01 && j !== a && ready[j]) blit(imgs[j], b, f);
    }
    ctx.restore();
    if (mobile) {
      /* sotto il video, il testo su fondo crema */
      var fade = ctx.createLinearGradient(0, b.y + b.h * .7, 0, b.y + b.h);
      fade.addColorStop(0, "rgba(246,240,234,0)"); fade.addColorStop(1, "rgba(246,240,234,1)");
      ctx.fillStyle = fade; ctx.fillRect(0, b.y + b.h * .7, W, b.h * .3 + 1);
      var top = ctx.createLinearGradient(0, b.y, 0, b.y + 40);
      top.addColorStop(0, "rgba(246,240,234,1)"); top.addColorStop(1, "rgba(246,240,234,0)");
      ctx.fillStyle = top; ctx.fillRect(0, b.y, W, 40);
    } else {
      /* velo crema a sinistra per la leggibilità, solo sopra la terra */
      var vh = H * .8;
      var veil = ctx.createLinearGradient(0, 0, W * .62, 0);
      veil.addColorStop(0, "rgba(246,240,234,.93)"); veil.addColorStop(.55, "rgba(246,240,234,.72)"); veil.addColorStop(1, "rgba(246,240,234,0)");
      ctx.fillStyle = veil;
      var v0 = H * .64; ctx.fillRect(0, 0, W, v0);
      for (var k = 0; k < 16; k++) {               /* il velo si dissolve verso la terra */
        var y0 = v0 + (vh - v0) * k / 16;
        ctx.globalAlpha = 1 - (k + .5) / 16; ctx.fillRect(0, y0, W, (vh - v0) / 16 + .5);
      }
      ctx.globalAlpha = 1;
      var vf = ctx.createLinearGradient(0, vh, 0, H);
      vf.addColorStop(0, "rgba(246,240,234,.0)"); vf.addColorStop(1, "rgba(30,20,18,.25)");
      ctx.fillStyle = vf; ctx.fillRect(0, vh, W, H - vh);
    }
  }

  /* ciclo di disegno: insegue la posizione dello scroll con un po' d'inerzia */
  var visible = true, running = false, dirty = true;
  function frame() {
    running = false;
    if (!visible) return;
    var prev = shown;
    shown += (target - shown) * .14;
    if (Math.abs(target - shown) < .0005) shown = target;
    if (dirty || shown !== prev) { draw(shown); updateHud(shown); dirty = false; }
    if (shown !== target) { running = true; requestAnimationFrame(frame); }
  }
  function kick() { dirty = true; if (!running) { running = true; requestAnimationFrame(frame); } }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }).observe(canvas);
  }
  resize(); draw(0);
  window.addEventListener("resize", function () { resize(); kick(); });
  /* il riquadro si rimisura ogni volta che cambia davvero dimensione */
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      var rc = canvas.getBoundingClientRect();
      if (Math.round(rc.width) !== W || Math.round(rc.height) !== H) { resize(); kick(); }
    }).observe(canvas);
  }

  /* indicatore di crescita */
  var tc = $("#tc"), fill = $("#scrub-fill"), scene = $("#hero-scene");
  var stages = ["Il seme", "Il germoglio", "Il fiore"];
  function updateHud(p) {
    var st = p < .33 ? 0 : p < .67 ? 1 : 2;
    if (tc) tc.textContent = stages[st];
    if (fill) fill.style.width = (p * 100).toFixed(2) + "%";
    if (scene) scene.textContent = (st + 1) + " / 3 · " + stages[st];
  }

  /* ---------- Movimento con lo scroll ---------- */
  var lenis = null;
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);

    if (typeof window.Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href"); if (id.length < 2) return;
          var el = id === "#top" ? 0 : $(id); if (el === null) return;
          e.preventDefault(); lenis.scrollTo(el, { offset: id === "#top" ? 0 : -76, duration: 1.4 });
        });
      });
    }

    /* 1. Il pin dell'apertura va creato per primo */
    var beats = $$(".beat");
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#hero-stage", start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 2.4); },
        pin: true, scrub: true, anticipatePin: 1,
        onUpdate: function (self) { target = self.progress; kick(); }
      }
    });
    tl.to(beats[0], { autoAlpha: 0, y: -40, duration: .08 }, .24)
      .fromTo(beats[1], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .08 }, .32)
      .to(beats[1], { autoAlpha: 0, y: -40, duration: .08 }, .58)
      .fromTo(beats[2], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .08 }, .66)
      .to({}, { duration: .26 }, .74);

    /* ingresso */
    gsap.from(".hero-top, .beat[data-beat='0'] > *, .player", { opacity: 0, y: 24, duration: 1.1, ease: "power3.out", stagger: .1, delay: .15 });

    /* 2. Manifesto: le parole si accendono una dopo l'altra */
    var st = $(".statement");
    if (st) {
      (function split(node) {
        $$(":scope > *", node).forEach(split);
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType !== 3 || !c.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        });
      })(st);
      var words = $$(".w", st);
      ScrollTrigger.create({
        trigger: st, start: "top 78%", end: "bottom 40%", scrub: true,
        onUpdate: function (self) { var k = Math.round(self.progress * words.length); words.forEach(function (w, i) { w.classList.toggle("on", i < k); }); }
      });
    }

    /* 3. Numeri che avanzano con lo scroll, anche all'indietro */
    $$("[data-scrub]").forEach(function (el) {
      var to = +el.dataset.scrub;
      el.textContent = "0";
      ScrollTrigger.create({
        trigger: ".numbers", start: "top 88%", end: "top 35%", scrub: true,
        onUpdate: function (self) { el.textContent = Math.round(to * self.progress); }
      });
    });

    /* 4. Comparse */
    $$(".sec-head, .card, .work, .timeline li, .territory, .agent > div, .chat, .check-copy > *, .form, .numbers-head, .trust-row").forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 34, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    $$(".chat .msg").forEach(function (m, i) {
      gsap.from(m, { opacity: 0, y: 14, duration: .5, delay: .3 + i * .7, ease: "power2.out", scrollTrigger: { trigger: ".chat", start: "top 75%", once: true } });
    });

    window.addEventListener("load", function () { resize(); ScrollTrigger.refresh(); kick(); });
  } else {
    target = shown = 1; draw(1); updateHud(1);
  }
  kick();

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
