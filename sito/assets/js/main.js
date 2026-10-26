/* Dinamoweb — bozza homepage v3
   Lenis + GSAP ScrollTrigger. Senza librerie o con "riduci movimento" la pagina resta completa e ferma. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var motion = hasGSAP && !reduced;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Header */
  var header = $(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var toggle = $("#menu-toggle");
  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Chiudi" : "Menu";
  });

  /* Scroll inerziale + ancore */
  var lenis = null;
  var lenisRef = function () { return lenis; };
  if (motion && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.hasAttribute("data-open-assistant")) return;
      var id = a.getAttribute("href"), target = id.length > 1 ? document.querySelector(id) : document.body;
      if (!target) return;
      e.preventDefault();
      header.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu";
      if (lenis) lenis.scrollTo(target, { offset: -84 }); else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* Manifesto: divisione in parole */
  var manifesto = $("#manifesto"), words = [];
  if (manifesto) {
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(manifesto.childNodes).forEach(function (node) {
      var hl = node.nodeType === 1 && node.hasAttribute("data-hl");
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement("span"); s.className = "w" + (hl ? " hl" : ""); s.textContent = part;
        frag.appendChild(s); words.push(s);
      });
    });
    manifesto.textContent = ""; manifesto.appendChild(frag);
    if (!motion) words.forEach(function (w) { w.classList.add("on"); });
  }

  /* Mappa: niente impulsi con "riduci movimento" */
  if (reduced) $$(".map animateMotion, .map animate").forEach(function (n) { n.parentNode.removeChild(n); });
  if (reduced) $$(".map .pulse-dot").forEach(function (n) { n.parentNode.removeChild(n); });

  /* ---------- Dinamo: il movimento entra, l'energia esce ---------- */
  (function dynamo() {
    var wrap = $("#dynamo"), canvas = $("#dyn-canvas");
    if (!wrap || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var outs = $$("#dyn-out li"), outEls = [$("#o0"), $("#o1"), $("#o2")];
    var outVals = outEls.map(function (e) { return parseInt(e.textContent, 10) || 0; });
    var LABELS = ["email · 22:47", "richiesta preventivo", "visita · Cremona", "ordine #2418", "WhatsApp · rivenditore",
      "catalogo · art. 4521", "domanda tecnica", "fattura da registrare", "visita · Parma", "ordine da ricopiare", "chiamata persa · 18:40", "visita · Lodi"];
    var BLUE = "85,144,247";
    var W = 0, H = 0, cx = 0, cy = 0, R = 0, mobile = false, outPts = [];
    var parts = [], pulses = [], rings = [];
    var angle = 0, speed = 0, boost = 0, hover = 0, glow = 0;
    var build = reduced ? 1 : 0, startAt = performance.now() + 600;
    var nextSpawn = 0, li = 0, running = false, visible = true, last = performance.now();
    var MONO = '500 10.5px "Geist Mono", ui-monospace, Menlo, monospace';

    function layout() {
      var r = wrap.getBoundingClientRect();
      W = r.width; H = r.height; mobile = W < 560;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var outBox = $("#dyn-out").getBoundingClientRect();
      if (mobile) { cx = W * .5; cy = H * .42; R = Math.min(W * .27, H * .2); }
      else { var free = outBox.left - r.left - 30; cx = free * .58; cy = H * .5; R = Math.min(free * .24, H * .27); }
      outPts = outs.map(function (l) {
        var b = l.getBoundingClientRect();
        return mobile ? { x: b.left - r.left + 10, y: b.top - r.top - 10 } : { x: b.left - r.left - 4, y: b.top - r.top + b.height * .62 };
      });
      if (!running) draw(performance.now(), 0);
    }

    function spawn(now) {
      var label = LABELS[li++ % LABELS.length];
      var sx, sy, th;
      if (mobile) { sx = W * (.1 + Math.random() * .8); sy = -10; th = -Math.PI / 2 + (Math.random() - .5) * 1.4; }
      else { sx = -10; sy = H * (.1 + Math.random() * .8); th = Math.PI + (Math.random() - .5) * 1.5; }
      var ex = cx + Math.cos(th) * R * 1.34, ey = cy + Math.sin(th) * R * 1.34;
      parts.push({ label: label, sx: sx, sy: sy, ex: ex, ey: ey, th: th, c1x: sx + (ex - sx) * .45, c1y: sy + (Math.random() - .5) * 80,
        t0: now, dur: 2600 + Math.random() * 1400, phase: 0, sp: 0 });
    }
    function bez(p, t) {
      var u = 1 - t, x = u * u * p.sx + 2 * u * t * p.c1x + t * t * p.ex, y = u * u * p.sy + 2 * u * t * p.c1y + t * t * p.ey;
      return [x, y];
    }
    function rimPoint(k) {
      var o = outPts[k], a = Math.atan2(o.y - cy, o.x - cx);
      return [cx + Math.cos(a) * R * 1.36, cy + Math.sin(a) * R * 1.36];
    }
    function hit(k) {
      outVals[k] += 1; outEls[k].textContent = outVals[k];
      outs[k].classList.add("hit");
      setTimeout(function () { outs[k].classList.remove("hit"); }, 450);
    }

    function draw(now, dt) {
      ctx.clearRect(0, 0, W, H);
      var b = Math.max(0, Math.min(1, build));
      var e = Math.min(1, (speed - .5) / 2.2);
      glow += ((.25 + e * .75) - glow) * .05;

      // bagliore
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6);
      g.addColorStop(0, "rgba(" + BLUE + "," + (.22 * glow * b).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + BLUE + ",0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // linee d'uscita
      outPts.forEach(function (o, k) {
        var s = rimPoint(k);
        ctx.strokeStyle = "rgba(" + BLUE + "," + (.18 + glow * .2) * b + ")"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s[0], s[1]);
        var mx = (s[0] + o.x) / 2;
        if (mobile) ctx.bezierCurveTo(s[0], (s[1] + o.y) / 2, o.x, (s[1] + o.y) / 2, o.x, o.y);
        else ctx.bezierCurveTo(mx, s[1], mx, o.y, o.x, o.y);
        ctx.stroke();
      });

      // statore: anelli che si disegnano all'ingresso, denti, bobine
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#2c2c2c"; ctx.beginPath(); ctx.arc(cx, cy, R * 1.36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * b); ctx.stroke();
      ctx.strokeStyle = "#3a3a3a"; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, Math.PI / 2, Math.PI / 2 + Math.PI * 2 * b); ctx.stroke();
      var teeth = 48;
      for (var i = 0; i < teeth * b; i++) {
        var ta = i / teeth * Math.PI * 2;
        var live = Math.max(0, Math.cos(ta - angle * 3)) * e;
        ctx.strokeStyle = live > .3 ? "rgba(" + BLUE + "," + (.35 + live * .6).toFixed(2) + ")" : "#383838";
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ta) * R * 1.06, cy + Math.sin(ta) * R * 1.06);
        ctx.lineTo(cx + Math.cos(ta) * R * 1.2, cy + Math.sin(ta) * R * 1.2); ctx.stroke();
      }
      // quote tecniche
      if (b > .9 && !mobile) {
        ctx.font = MONO; ctx.fillStyle = "#4d4d4d";
        ctx.strokeStyle = "#2c2c2c"; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(cx + R * .96, cy - R * .96); ctx.lineTo(cx + R * 1.5, cy - R * 1.5); ctx.lineTo(cx + R * 1.5 + 50, cy - R * 1.5); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText("STATORE", cx + R * 1.5 + 4, cy - R * 1.5 - 6);
        ctx.fillText("ROTORE  " + Math.round(speed * 60) + " giri/min", cx - R * .9, cy + R * 1.62);
      }

      // rotore
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.globalAlpha = b;
      for (var k = 0; k < 6; k++) {
        var a0 = k * Math.PI / 3 + .12, a1 = (k + 1) * Math.PI / 3 - .12;
        ctx.beginPath(); ctx.arc(0, 0, R * .96, a0, a1); ctx.arc(0, 0, R * .5, a1, a0, true); ctx.closePath();
        ctx.fillStyle = k % 2 ? "rgba(" + BLUE + "," + (.1 + glow * .35).toFixed(3) + ")" : "rgba(28,28,28,.95)";
        ctx.fill(); ctx.strokeStyle = k % 2 ? "rgba(" + BLUE + ",.65)" : "#4a4a4a"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(Math.cos(a0 - .12) * R * .22, Math.sin(a0 - .12) * R * .22); ctx.lineTo(Math.cos(a0 - .12) * R * .96, Math.sin(a0 - .12) * R * .96);
        ctx.strokeStyle = "#333"; ctx.stroke();
      }
      ctx.restore();
      // mozzo
      var hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .3);
      hg.addColorStop(0, "rgba(220,233,255," + (.55 + glow * .45) * b + ")");
      hg.addColorStop(.45, "rgba(" + BLUE + "," + (.6 + glow * .4) * b + ")");
      hg.addColorStop(1, "rgba(" + BLUE + ",0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, R * .3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(cx, cy, R * .12, 0, Math.PI * 2); ctx.stroke();

      // anelli d'energia
      rings = rings.filter(function (r) {
        var t = (now - r.t0) / 900; if (t > 1) return false;
        ctx.strokeStyle = "rgba(" + BLUE + "," + (1 - t) * .7 + ")";
        ctx.beginPath(); ctx.arc(cx, cy, R * (.25 + t * 1.1), 0, Math.PI * 2); ctx.stroke(); return true;
      });

      // particelle in ingresso
      ctx.font = MONO; ctx.textBaseline = "middle";
      parts = parts.filter(function (p) {
        var x, y, alpha = 1, lab = 0;
        if (p.phase === 0) {
          var t = Math.min(1, (now - p.t0) / p.dur), te = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          var q = bez(p, te); x = q[0]; y = q[1]; lab = t < .75 ? 1 : 1 - (t - .75) / .25;
          // scia
          var q2 = bez(p, Math.max(0, te - .05));
          ctx.strokeStyle = "rgba(244,244,244,.25)"; ctx.beginPath(); ctx.moveTo(q2[0], q2[1]); ctx.lineTo(x, y); ctx.stroke();
          if (t >= 1) { p.phase = 1; p.t1 = now; }
        } else {
          var s = Math.min(1, (now - p.t1) / 850);
          var rr = R * 1.34 * (1 - s) + R * .15 * s, aa = p.th + s * 2.6;
          x = cx + Math.cos(aa) * rr; y = cy + Math.sin(aa) * rr; alpha = 1 - s * .6;
          if (s >= 1) {
            boost += .55; rings.push({ t0: now });
            var k = (Math.random() * 3) | 0;
            pulses.push({ k: k, t0: now + 120 });
            return false;
          }
        }
        var blue = p.phase === 1;
        ctx.fillStyle = blue ? "rgba(" + BLUE + "," + alpha + ")" : "rgba(244,244,244," + alpha + ")";
        ctx.beginPath(); ctx.arc(x, y, blue ? 2.6 : 2.2, 0, Math.PI * 2); ctx.fill();
        if (lab > 0.02) {
          var tw = ctx.measureText(p.label).width, bx = x + 10, by = y - 11;
          if (mobile) { bx = Math.min(W - tw - 18, Math.max(4, x - tw / 2)); by = y - 30; }
          ctx.globalAlpha = lab;
          ctx.fillStyle = "rgba(12,12,12,.88)"; ctx.fillRect(bx, by, tw + 14, 22);
          ctx.strokeStyle = "#333"; ctx.strokeRect(bx + .5, by + .5, tw + 13, 21);
          ctx.fillStyle = "#c9c9c9"; ctx.fillText(p.label, bx + 7, by + 11.5);
          ctx.globalAlpha = 1;
        }
        return true;
      });

      // impulsi di corrente in uscita
      pulses = pulses.filter(function (u) {
        var t = (now - u.t0) / 700; if (t < 0) return true;
        if (t >= 1) { hit(u.k); return false; }
        var s = rimPoint(u.k), o = outPts[u.k], mx = (s[0] + o.x) / 2;
        var p0, p1, p2, p3;
        if (mobile) { p0 = s; p1 = [s[0], (s[1] + o.y) / 2]; p2 = [o.x, (s[1] + o.y) / 2]; p3 = [o.x, o.y]; }
        else { p0 = s; p1 = [mx, s[1]]; p2 = [mx, o.y]; p3 = [o.x, o.y]; }
        for (var j = 0; j < 6; j++) {
          var tt = Math.max(0, t - j * .025), u1 = 1 - tt;
          var px = u1 * u1 * u1 * p0[0] + 3 * u1 * u1 * tt * p1[0] + 3 * u1 * tt * tt * p2[0] + tt * tt * tt * p3[0];
          var py = u1 * u1 * u1 * p0[1] + 3 * u1 * u1 * tt * p1[1] + 3 * u1 * tt * tt * p2[1] + tt * tt * tt * p3[1];
          ctx.fillStyle = "rgba(156,195,255," + (1 - j / 6) + ")";
          ctx.beginPath(); ctx.arc(px, py, 2.4 - j * .3, 0, Math.PI * 2); ctx.fill();
        }
        return true;
      });
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (now > startAt) build = Math.min(1, build + dt / 1.6);
      var sv = (typeof lenisRef === "function" && lenisRef()) ? Math.min(2.5, Math.abs(lenisRef().velocity || 0) * .04) : 0;
      boost *= Math.pow(.35, dt);
      var target = (build < 1 ? .6 * build : .6) + boost + hover * .9 + sv;
      speed += (target - speed) * Math.min(1, dt * 2.2);
      angle += speed * dt;
      if (build > .85 && now > nextSpawn) {
        spawn(now);
        nextSpawn = now + (mobile ? 1500 : 950) + Math.random() * 700;
      }
      draw(now, dt);
      requestAnimationFrame(frame);
    }
    function start() { if (running || reduced || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }

    layout();
    if (reduced) {
      // fotogramma fermo e leggibile
      var now = performance.now();
      speed = .6; angle = .4; build = 1;
      for (var s = 0; s < 4; s++) { spawn(now - 900 * (s + 1)); }
      draw(now, 0);
    }
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    wrap.addEventListener("pointerenter", function () { hover = 1; });
    wrap.addEventListener("pointerleave", function () { hover = 0; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(wrap);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    start();
  })();

  if (motion) {
    document.documentElement.classList.add("js-motion");
    gsap.registerPlugin(ScrollTrigger);
    /* Apertura: il titolo entra parola per parola, poi la dinamo si disegna e parte */
    var intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: .15 });
    intro.from(".hero .meta-row .meta", { opacity: 0, y: 10, duration: .8, stagger: .1 }, 0)
      .from(".hero h1 .w", { yPercent: 110, opacity: 0, filter: "blur(14px)", duration: 1.3, stagger: .08 }, .1)
      .from(".hero-lead, .hero-actions", { opacity: 0, y: 24, duration: 1.1, stagger: .12 }, .9)
      .from(".dyn-tag", { opacity: 0, duration: .8, stagger: .15 }, 1.1)
      .from(".dyn-out li", { opacity: 0, x: 16, duration: .9, stagger: .12 }, 1.6)
      .from(".trust, .stats .stat", { opacity: 0, y: 20, duration: 1, stagger: .08 }, 1.4);

    /* Titoli e blocchi */
    $$(".reveal-lines").forEach(function (el) {
      if (el.closest(".hero")) return;
      gsap.from(el.querySelectorAll(".line > span"), { yPercent: 118, duration: 1.3, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".fade-up").forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    $$(".meta-row").forEach(function (el) {
      if (el.closest(".hero")) return;
      gsap.from(el.children, { opacity: 0, x: -10, duration: .8, stagger: .1, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });
    gsap.from(".eco-card", { opacity: 0, y: 50, duration: 1.1, ease: "power3.out", stagger: .1, scrollTrigger: { trigger: ".eco", start: "top 85%" } });
    gsap.from(".eco-art svg", { opacity: 0, y: 30, scale: .94, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".eco", start: "top 80%" } });

    /* Contatori */
    $$("[data-count]").forEach(function (el) {
      var end = parseInt(el.getAttribute("data-count"), 10), o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: "top 95%", once: true, onEnter: function () {
        gsap.fromTo(o, { v: 0 }, { v: end, duration: 2, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
    });

    /* Manifesto */
    if (words.length) ScrollTrigger.create({ trigger: manifesto, start: "top 80%", end: "bottom 45%", scrub: true, onUpdate: function (self) {
      var n = Math.round(self.progress * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
    } });

    /* Agente: la conversazione parte quando entra in vista */
    gsap.timeline({ scrollTrigger: { trigger: "#agent", start: "top 75%" } })
      .from("#agent", { opacity: 0, y: 40, duration: 1, ease: "power3.out" })
      .from("#agent [data-seq='1']", { opacity: 0, y: 12, duration: .6 }, .5)
      .from("#agent [data-seq='2']", { opacity: 0, y: 12, duration: .6 }, 1.4)
      .from("#agent [data-seq='3'] span", { opacity: 0, x: -8, duration: .5, stagger: .25 }, 1.9);

    var mm = gsap.matchMedia();
    mm.add("(min-width: 961px)", function () {
      var track = $("#works-track"), bar = $(".works-bar");
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: "#works-pin", start: "top 18%", end: function () { return "+=" + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) { bar.style.setProperty("--p", self.progress.toFixed(3)); } } });
      gsap.utils.toArray(".work-media img").forEach(function (img) {
        gsap.fromTo(img, { xPercent: 3 }, { xPercent: -3, ease: "none", scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      gsap.fromTo("#timeline", { "--fill": 0 }, { "--fill": 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 85%", end: "top 40%", scrub: true } });
      return function () { gsap.set(track, { x: 0 }); };
    });
    mm.add("(max-width: 960px)", function () {
      gsap.fromTo("#timeline", { "--fill": 0 }, { "--fill": 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 80%", end: "bottom 60%", scrub: true } });
    });

    /* Metodo */
    gsap.fromTo("#steps", { "--fill": 0 }, { "--fill": 1, ease: "none", scrollTrigger: { trigger: "#steps", start: "top 60%", end: "bottom 60%", scrub: true } });
    $$(".step").forEach(function (s) { ScrollTrigger.create({ trigger: s, start: "top 62%", toggleClass: { targets: s, className: "on" } }); });

    /* Storia, dashboard, footer */
    gsap.from(".tl", { opacity: 0, y: 30, duration: 1, ease: "power3.out", stagger: .12, scrollTrigger: { trigger: "#timeline", start: "top 85%" } });
    gsap.from(".heat .c", { opacity: 0, duration: .5, stagger: { each: .008, from: "start" }, scrollTrigger: { trigger: ".heat", start: "top 88%" } });
    gsap.from(".funnel i", { width: 0, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".funnel", start: "top 88%" } });
    gsap.from(".footer-word", { yPercent: 50, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".footer-word", start: "top 100%" } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  } else {
    $$(".step").forEach(function (s) { s.classList.add("on"); });
  }

  /* Luce che segue il mouse sulle tavole */
  $$(".eco-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--x", (e.clientX - r.left) + "px"); card.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* Pulsanti magnetici + cursore */
  if (finePointer && !reduced) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * .2).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
    var cur = $("#cursor");
    if (cur && hasGSAP) {
      var qx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3" }), qy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3" });
      window.addEventListener("pointermove", function (e) { cur.classList.add("show"); qx(e.clientX); qy(e.clientY); }, { passive: true });
      document.addEventListener("pointerleave", function () { cur.classList.remove("show"); });
      document.addEventListener("pointerover", function (e) { cur.classList.toggle("big", !!e.target.closest("a, button, .eco-card, .work")); });
    }
  }

  /* LeadRaptor: visite simulate */
  (function () {
    var body = $("#feed-body"), count = $("#feed-count");
    if (!body || reduced) return;
    var pool = [
      ["Produttore di componenti oleodinamici", "Cremona · prima visita", 5, "Cataloghi prodotto", "Alto"],
      ["Impresa edile", "Pavia · 3ª visita", 3, "Foto e video", "Medio"],
      ["Azienda alimentare", "Parma · prima visita", 6, "E-commerce, Agenti AI", "Alto"],
      ["Carpenteria metallica", "Piacenza · 2ª visita", 2, "Lavori, Contatti", "Medio"],
      ["Distributore elettrico", "Lodi · prima visita", 1, "Home", "Basso"]
    ];
    var n = 3, i = 0, seen = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }).observe(body);
    setInterval(function () {
      if (!seen || document.hidden) return;
      var r = pool[i++ % pool.length], tr = document.createElement("tr");
      tr.className = "new";
      tr.innerHTML = "<td></td><td class='num'></td><td></td><td><span class='lvl'></span></td>";
      tr.children[0].textContent = r[0];
      var sp = document.createElement("span"); sp.textContent = r[1]; tr.children[0].appendChild(sp);
      tr.children[1].textContent = r[2]; tr.children[2].textContent = r[3];
      var l = tr.querySelector(".lvl"); l.textContent = r[4]; if (r[4] === "Alto") l.classList.add("hot");
      body.insertBefore(tr, body.firstChild);
      while (body.children.length > 4) body.removeChild(body.lastChild);
      count.textContent = (++n) + " oggi";
    }, 4200);
  })();

  /* Moduli (bozza: nessun invio) */
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var wl = $("#waitlist"), wlNote = $("#wl-note");
  wl.addEventListener("submit", function (e) {
    e.preventDefault();
    wlNote.textContent = emailOk(wl.email.value.trim()) ? "Bozza: l'iscrizione non è ancora collegata. In produzione arriverà qui la conferma." : "Scrivi un indirizzo email valido, per esempio nome@azienda.it.";
  });
  var form = $("#checkup-form"), status = $("#checkup-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var miss = [];
    if (!form.nome.value.trim()) miss.push("nome");
    if (!form.azienda.value.trim()) miss.push("azienda");
    if (!emailOk(form.email.value.trim())) miss.push("email valida");
    status.textContent = miss.length ? "Manca: " + miss.join(", ") + "." : "Bozza: il modulo non invia ancora dati. In produzione la richiesta arriverà al team commerciale.";
  });

  /* Assistente demo */
  var btn = $("#assistant-toggle"), panel = $("#assistant"), close = $("#assistant-close"), chat = $("#assistant-body");
  var answers = {
    preventivo: ["Vorrei un preventivo", "Volentieri. Per cosa ti serve? Sito o e-commerce, agente AI, campagne oppure foto e video. Se preferisci, prenota il check-up gratuito di 30 minuti e ne parliamo con un consulente."],
    assistenza: ["Ho bisogno di assistenza", "Dimmi il problema: posta elettronica, accesso al sito o altro. Se non riesco a risolverlo apro una richiesta e la passo al tecnico con il riepilogo già scritto. Assistenza: lun–ven 9–13 e 14–18."],
    agente: ["Cos'è un agente AI?", "È un assistente che conosce cataloghi, listini e procedure della tua azienda. Risponde a clienti e rivenditori sul sito o su WhatsApp a qualsiasi ora e, quando serve, passa la conversazione a una persona del tuo team."]
  };
  function setOpen(o) { panel.hidden = !o; btn.setAttribute("aria-expanded", String(o)); if (o) close.focus(); }
  function bubble(cls, who, text) {
    var p = document.createElement("p"); p.className = "msg " + cls;
    var s = document.createElement("small"); s.textContent = who; p.appendChild(s);
    if (text === null) { var t = document.createElement("span"); t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>"; p.appendChild(t); }
    else p.appendChild(document.createTextNode(text));
    chat.appendChild(p); chat.scrollTop = chat.scrollHeight; return p;
  }
  btn.addEventListener("click", function () { setOpen(panel.hidden); });
  close.addEventListener("click", function () { setOpen(false); btn.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { setOpen(false); btn.focus(); } });
  $$("[data-open-assistant]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); setOpen(true); }); });
  $("#assistant-quick").addEventListener("click", function (e) {
    var q = e.target.closest("button"); if (!q || !answers[q.dataset.q]) return;
    var pair = answers[q.dataset.q];
    bubble("msg-in", "Tu", pair[0]);
    var typing = bubble("msg-out", "Assistente", null);
    setTimeout(function () { typing.remove(); bubble("msg-out", "Assistente", pair[1]); }, 900);
  });
})();
