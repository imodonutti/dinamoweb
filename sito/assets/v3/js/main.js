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

  /* ---------- Il film dell'apertura ----------
     Un "video" disegnato in tempo reale: luce calda, una sfera che sale e
     colonne di vetro che la rifrangono. Lo scroll ne è la testina di lettura:
     in avanti e all'indietro. */
  var canvas = $("#film"), ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1, mobile = false;
  var target = 0, shown = 0, t0 = performance.now();

  function mix(a, b, k) { return a + (b - a) * k; }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  /* colore lungo una sequenza di tappe, p in [0,1] */
  function ramp(stops, p) {
    var n = stops.length - 1, i = Math.min(n - 1, Math.floor(p * n)), k = ease(p * n - i);
    var a = hex(stops[i]), b = hex(stops[i + 1]);
    return [Math.round(mix(a[0], b[0], k)), Math.round(mix(a[1], b[1], k)), Math.round(mix(a[2], b[2], k))];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  function resize() {
    var r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = W < 760;
  }

  function orb(cx, cy, R, p, time) {
    var core = ramp(["#FFE3C8", "#FFD3A8", "#F7A877", "#F08A5E"], p);
    var mid = ramp(["#F4A273", "#EE8A4E", "#DD5F52", "#CD4D52"], p);
    var edge = ramp(["#E26A55", "#CD4D52", "#9E2F3C", "#5E1C27"], p);
    var hx = cx - R * (.28 + Math.sin(time * .4) * .03), hy = cy - R * (.32 + Math.cos(time * .33) * .03);
    var g = ctx.createRadialGradient(hx, hy, R * .05, cx, cy, R);
    g.addColorStop(0, rgba(core, 1));
    g.addColorStop(.45, rgba(mid, 1));
    g.addColorStop(.86, rgba(edge, 1));
    g.addColorStop(1, rgba(edge, .0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  }

  function draw(p, time) {
    if (!W) return;
    /* fondo: crema a sinistra, sempre più caldo a destra */
    var bgL = ramp(["#F6F0EA", "#F6EEE6", "#F5EAE1", "#F4E6DC"], p);
    var bgR = ramp(["#F3E3D6", "#F2CDB4", "#EBAE93", "#D9897A"], p);
    var bg = mobile ? ctx.createLinearGradient(0, H, 0, 0) : ctx.createLinearGradient(0, 0, W, 0);
    bg.addColorStop(0, rgba(bgL, 1)); bg.addColorStop(.45, rgba(bgL, 1)); bg.addColorStop(1, rgba(bgR, 1));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* la sfera sale e cresce */
    var cx, cy, R;
    if (mobile) { cx = W * mix(.78, .64, p); cy = H * mix(.34, .22, p); R = W * mix(.42, .5, ease(p)); }
    else { cx = W * mix(.76, .68, p); cy = H * mix(.74, .5, ease(Math.min(1, p * 1.4))); R = Math.min(W, H) * mix(.3, .52, ease(p)); }

    /* alone */
    var halo = ctx.createRadialGradient(cx, cy, R * .4, cx, cy, R * 2.1);
    var hc = ramp(["#F7B98F", "#F2A070", "#E5735E", "#C9474E"], p);
    halo.addColorStop(0, rgba(hc, .55)); halo.addColorStop(1, rgba(hc, 0));
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    orb(cx, cy, R, p, time);

    /* colonne di vetro che scorrono e rifrangono */
    var n = mobile ? 5 : 7, sw = (mobile ? W * .13 : W * .055), start = mobile ? W * .3 : W * .5;
    var slide = p * (mobile ? W * .25 : W * .18);
    for (var i = 0; i < n; i++) {
      var x = start + i * sw * 1.02 - slide + Math.sin(time * .25 + i) * 2;
      if (x > W || x + sw < 0) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, 0, sw, H); ctx.clip();
      var shift = (i - n / 2) * sw * .35 * (1 - p * .4);
      ctx.translate(cx + shift, cy); ctx.scale(1.12, 1.02); ctx.translate(-cx, -cy);
      ctx.fillStyle = rgba(ramp(["#F2DCCB", "#F0C3A6", "#E59F86", "#C9776C"], p), .55);
      ctx.fillRect(x - sw, 0, sw * 3, H);
      orb(cx, cy, R, p, time);
      ctx.restore();
      var gl = ctx.createLinearGradient(x, 0, x + sw, 0);
      gl.addColorStop(0, "rgba(255,255,255,.32)"); gl.addColorStop(.12, "rgba(255,255,255,.06)");
      gl.addColorStop(.85, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(120,30,40,.12)");
      ctx.fillStyle = gl; ctx.fillRect(x, 0, sw, H);
    }

    /* velo per la leggibilità del testo */
    var vl = rgba(bgL, 1), v0 = rgba(bgL, 0);
    var veil = mobile ? ctx.createLinearGradient(0, H, 0, H * .38) : ctx.createLinearGradient(0, 0, W * .62, 0);
    veil.addColorStop(0, vl); veil.addColorStop(mobile ? .55 : .55, rgba(bgL, mobile ? .92 : .82)); veil.addColorStop(1, v0);
    ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
  }

  /* ciclo di disegno: insegue la posizione dello scroll con un po' d'inerzia */
  var visible = true, running = false;
  function frame(now) {
    running = false;
    if (!visible) return;
    var time = (now - t0) / 1000;
    shown += (target - shown) * .12;
    if (Math.abs(target - shown) < .0005) shown = target;
    draw(shown, reduce ? 0 : time);
    updateHud(shown);
    if (!reduce) { running = true; requestAnimationFrame(frame); }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }).observe(canvas);
  }
  resize(); draw(0, 0);
  window.addEventListener("resize", function () { resize(); draw(shown, 0); kick(); });

  /* timecode e barra */
  var tc = $("#tc"), fill = $("#scrub-fill"), scene = $("#hero-scene");
  function updateHud(p) {
    var s = Math.round(p * 12);
    if (tc) tc.textContent = "00:" + (s < 10 ? "0" : "") + s;
    if (fill) fill.style.width = (p * 100).toFixed(2) + "%";
    if (scene) scene.textContent = "Scena " + (p < .33 ? 1 : p < .67 ? 2 : 3) + " / 3";
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
    target = shown = .5; draw(.5, 0); updateHud(.5);
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
