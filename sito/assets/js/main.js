/* Dinamoweb — bozza homepage v3
   Lenis + GSAP ScrollTrigger. Senza librerie o con "riduci movimento" la pagina resta completa e ferma. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var motion = hasGSAP && !reduced;
  var playIntro = motion && document.documentElement.classList.contains("has-intro");
  if (!motion) document.documentElement.classList.remove("has-intro");
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

  /* ---------- Dinamo in prospettiva: il movimento entra, l'energia esce ---------- */
  (function dynamo3d() {
    var stage = $("#hero-stage"), canvas = $("#dyn-canvas");
    if (!stage || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var outs = $$("#dyn-out li"), outEls = [$("#o0"), $("#o1"), $("#o2")], rpmEl = $("#rpm");
    var outVals = outEls.map(function (e) { return parseInt(e.textContent, 10) || 0; });
    var LABELS = ["email · 22:47", "richiesta preventivo", "visita · Cremona", "ordine #2418", "WhatsApp · rivenditore", "catalogo · art. 4521",
      "domanda tecnica", "chiamata persa · 18:40", "visita · Parma", "ordine da ricopiare", "visita · Lodi", "fattura da registrare"];
    var BLUE = "85,144,247", MONO = '500 14px "Geist Mono", ui-monospace, Menlo, monospace', MONO_S = '500 12px "Geist Mono", ui-monospace, Menlo, monospace';
    var VMAX = 1.25; // velocita' massima del rotore (rad/s, circa 75 giri/min)
    var W = 0, H = 0, mobile = false, R = 0, CX = 0, CY = 0, F = 1000, outPts = [], textRight = 0;
    var tilt = 1.0, tiltNow = 1.0, yaw = 0, yawT = 0, pitchT = 0, roll = -.35;
    var angle = 0, speed = 0, boost = 0, hover = 0, glow = .3, scrollP = 0;
    var build = reduced ? 1 : 0, startAt = performance.now() + 350;
    var parts = [], pulses = [], rings = [], nextSpawn = 0, li = 0, running = false, visible = true, last = performance.now();
    // arrivo del rotore (intro)
    var arr = null, rotorHidden = playIntro, hold = playIntro, trail = [], flash = 0, ripples = [], off = [0, 0, 0], spinMul = 1, arrP = 1;
    function arrival(now) {
      if (!arr) { off = [0, 0, 0]; spinMul = 1; arrP = 1; return; }
      var p = Math.max(0, Math.min(1, (now - arr.t0) / arr.dur)), e = 1 - Math.pow(1 - p, 3);
      arrP = p;
      off = [R * 2.6 * (1 - e) * Math.cos(p * 2.4), R * 8 * (1 - e), R * 4.2 * (1 - e) + Math.sin(p * 20) * R * .05 * (1 - e)];
      spinMul = 1 + 11 * (1 - e);
      if (p >= 1) dock(now);
    }
    function dock(now) {
      arr = null; off = [0, 0, 0]; spinMul = 1; arrP = 1; trail = [];
      flash = 1; ripples.push(now); boost += 2.6; hold = false;
      rings.push({ t0: now }); rings.push({ t0: now + 140 }); rings.push({ t0: now + 280 });
      nextSpawn = now + 500;
    }
    window.dynCtl = {
      arrive: function (ms) { rotorHidden = false; hold = true; arr = { t0: performance.now(), dur: ms || 2000 }; },
      skip: function () { if (arr) dock(performance.now()); rotorHidden = false; hold = false; build = 1; }
    };

    function layout() {
      var r = stage.getBoundingClientRect();
      W = r.width; H = r.height; mobile = W < 760;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = mobile ? W * .46 : Math.min(W * .235, H * .42);
      CX = mobile ? W * .56 : W * .69; CY = mobile ? H * .7 : H * .58;
      F = Math.max(W, H) * 1.5;
      var copy = $(".hero-dyn .hero-lead");
      textRight = copy ? copy.getBoundingClientRect().right - r.left : 0;
      outPts = outs.map(function (l) { var b = l.getBoundingClientRect(); return { x: b.left - r.left + b.width * .5, y: b.top - r.top - 4 }; });
      if (!running) draw(performance.now());
    }

    // proiezione: piano (u,v) con altezza h -> schermo
    function P(u, v, h) {
      var cr = Math.cos(roll), sr = Math.sin(roll);
      var x = u * cr - v * sr, y = u * sr + v * cr;
      var ct = Math.cos(tiltNow), st = Math.sin(tiltNow);
      var up = y * ct + h * st, d = y * st - h * ct;
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var x2 = x * cy - d * sy, d2 = x * sy + d * cy;
      var s = F / (F + d2);
      return [CX + x2 * s, CY - up * s, d2, s];
    }
    function Pr(u, v, h) { return P(u + off[0], v + off[1], h + off[2]); }
    function segr(u1, v1, h1, u2, v2, h2) { var a = Pr(u1, v1, h1), b2 = Pr(u2, v2, h2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); }
    function ring(r, h, a0, a1, n) {
      a0 = a0 || 0; a1 = a1 === undefined ? Math.PI * 2 : a1; n = n || 90;
      ctx.beginPath();
      for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n, p = P(Math.cos(a) * r, Math.sin(a) * r, h); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    }
    function seg(u1, v1, h1, u2, v2, h2) { var a = P(u1, v1, h1), b = P(u2, v2, h2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }

    function spawn(now) {
      var a0 = mobile ? (-.4 + Math.random() * 1.8) : (-1.3 + Math.random() * 2.6);
      parts.push({ label: LABELS[li++ % LABELS.length], a0: a0, r0: R * (2.4 + Math.random() * .6), t0: now, dur: 3200 + Math.random() * 1600, spin: .9 + Math.random() * .5 });
    }
    function hit(k) {
      outVals[k] += 1; outEls[k].textContent = outVals[k];
      outs[k].classList.add("hit"); setTimeout(function () { outs[k].classList.remove("hit"); }, 450);
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      var b = Math.max(0, Math.min(1, build)), e = Math.max(0, Math.min(1, (speed - .5) / (VMAX - .5)));
      glow += ((.3 + e * .7) - glow) * .05;
      arrival(now);
      var hub = Pr(0, 0, R * .2);

      // bagliore attorno al mozzo
      var g = ctx.createRadialGradient(hub[0], hub[1], 0, hub[0], hub[1], R * 1.9);
      g.addColorStop(0, "rgba(" + BLUE + "," + (.3 * glow * b).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + BLUE + ",0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // griglia a pavimento che sfuma verso l'orizzonte
      var ext = R * 3.2, step = R / 4;
      for (var gx = -ext; gx <= ext + 1; gx += step) {
        var al = (1 - Math.abs(gx) / ext) * .07 * b;
        ctx.strokeStyle = "rgba(255,255,255," + al.toFixed(3) + ")"; ctx.lineWidth = 1;
        seg(gx, -ext, 0, gx, ext, 0); ctx.stroke();
        seg(-ext, gx, 0, ext, gx, 0); ctx.stroke();
      }
      // cerchi di quota
      ctx.setLineDash([3, 6]); ctx.strokeStyle = "rgba(255,255,255," + (.07 * b) + ")";
      ring(R * 2.1, 0); ctx.stroke(); ring(R * 2.8, 0); ctx.stroke(); ctx.setLineDash([]);

      // statore: cilindro con denti
      var hs = R * .16, so = R * 1.34, si = R * 1.06;
      ctx.lineWidth = 1;
      // corpo dello statore: corona piena
      if (b > .05) {
        ctx.beginPath();
        for (var z = 0; z <= 90; z++) { var az = z / 90 * Math.PI * 2, pz = P(Math.cos(az) * so, Math.sin(az) * so, hs); z ? ctx.lineTo(pz[0], pz[1]) : ctx.moveTo(pz[0], pz[1]); }
        for (z = 90; z >= 0; z--) { az = z / 90 * Math.PI * 2; pz = P(Math.cos(az) * si, Math.sin(az) * si, hs); ctx.lineTo(pz[0], pz[1]); }
        ctx.closePath(); ctx.fillStyle = "rgba(22,24,30," + (.78 * b).toFixed(3) + ")"; ctx.fill();
        // fianco anteriore
        ctx.beginPath();
        for (z = 0; z <= 90; z++) { az = z / 90 * Math.PI * 2; pz = P(Math.cos(az) * so, Math.sin(az) * so, 0); z ? ctx.lineTo(pz[0], pz[1]) : ctx.moveTo(pz[0], pz[1]); }
        for (z = 90; z >= 0; z--) { az = z / 90 * Math.PI * 2; pz = P(Math.cos(az) * so, Math.sin(az) * so, hs); ctx.lineTo(pz[0], pz[1]); }
        ctx.closePath(); ctx.fillStyle = "rgba(16,17,21," + (.6 * b).toFixed(3) + ")"; ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255," + (.22 * b) + ")"; ring(so, 0, 0, Math.PI * 2 * b); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + (.42 * b) + ")"; ring(so, hs, 0, Math.PI * 2 * b); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + (.2 * b) + ")"; ring(si, hs, 0, Math.PI * 2 * b); ctx.stroke();
      var teeth = 60;
      for (var i = 0; i < teeth * b; i++) {
        var ta = i / teeth * Math.PI * 2, ca = Math.cos(ta), sa = Math.sin(ta);
        var live = Math.max(0, Math.cos(ta - angle * 3)) * e;
        ctx.strokeStyle = live > .25 ? "rgba(" + BLUE + "," + (.35 + live * .65).toFixed(2) + ")" : "rgba(255,255,255,.3)";
        seg(ca * si, sa * si, hs, ca * R * 1.24, sa * R * 1.24, hs); ctx.stroke();
        var f = P(ca * so, sa * so, 0);
        if (f[2] < 0 && i % 2 === 0) { ctx.strokeStyle = "rgba(255,255,255,.1)"; seg(ca * so, sa * so, 0, ca * so, sa * so, hs); ctx.stroke(); }
      }

      // onda d'urto sul pavimento dopo l'aggancio
      ripples = ripples.filter(function (t0) {
        var t = (now - t0) / 1500; if (t > 1) return false;
        ctx.strokeStyle = "rgba(" + BLUE + "," + ((1 - t) * .7).toFixed(3) + ")"; ctx.lineWidth = 2 * (1 - t) + .5;
        ring(R * (.6 + t * 3.4), 0, 0, Math.PI * 2, 120); ctx.stroke(); ctx.lineWidth = 1; return true;
      });
      // scia e spinta durante il volo
      if (arr && !rotorHidden) {
        trail.push([hub[0], hub[1], hub[3]]); if (trail.length > 26) trail.shift();
        trail.forEach(function (t, q) {
          var a = q / trail.length;
          ctx.fillStyle = "rgba(156,195,255," + (a * .28).toFixed(3) + ")";
          ctx.beginPath(); ctx.ellipse(t[0], t[1], R * .5 * t[2] * a, R * .16 * t[2] * a, 0, 0, Math.PI * 2); ctx.fill();
        });
        var th = Pr(0, 0, -R * .2), tg = ctx.createRadialGradient(th[0], th[1], 0, th[0], th[1], R * 1.1 * th[3]);
        tg.addColorStop(0, "rgba(200,222,255,.55)"); tg.addColorStop(.4, "rgba(" + BLUE + ",.35)"); tg.addColorStop(1, "rgba(" + BLUE + ",0)");
        ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(th[0], th[1], R * 1.1 * th[3], 0, Math.PI * 2); ctx.fill();
        // ombra che si stringe sul pavimento
        var sh = P(off[0], off[1], 0), sk = Math.max(.15, 1 - off[2] / (R * 4.2));
        ctx.fillStyle = "rgba(" + BLUE + "," + (.18 * sk).toFixed(3) + ")";
        ctx.beginPath(); ctx.ellipse(sh[0], sh[1], R * 1.2 * sh[3] * sk, R * .45 * sh[3] * sk, 0, 0, Math.PI * 2); ctx.fill();
      }

      // rotore: sei settori in rilievo
      var hr = R * .13;
      if (!rotorHidden) {
      for (var k = 0; k < 6; k++) {
        var a0 = angle + k * Math.PI / 3 + .1, a1 = angle + (k + 1) * Math.PI / 3 - .1, n = 16, pts = [];
        for (var j = 0; j <= n; j++) { var a = a0 + (a1 - a0) * j / n; pts.push(Pr(Math.cos(a) * R * .96, Math.sin(a) * R * .96, hr)); }
        for (j = n; j >= 0; j--) { a = a0 + (a1 - a0) * j / n; pts.push(Pr(Math.cos(a) * R * .46, Math.sin(a) * R * .46, hr)); }
        ctx.globalAlpha = arr ? 1 : b;
        ctx.beginPath(); pts.forEach(function (p, q) { q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath();
        ctx.fillStyle = k % 2 ? "rgba(" + BLUE + "," + (.14 + glow * .38).toFixed(3) + ")" : "rgba(30,32,38,.82)";
        ctx.fill(); ctx.strokeStyle = k % 2 ? "rgba(156,195,255,.75)" : "rgba(255,255,255,.28)"; ctx.stroke();
        // spigoli verticali esterni
        [a0, a1].forEach(function (aa) { ctx.strokeStyle = "rgba(255,255,255,.14)"; segr(Math.cos(aa) * R * .96, Math.sin(aa) * R * .96, 0, Math.cos(aa) * R * .96, Math.sin(aa) * R * .96, hr); ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      // albero e mozzo luminoso
      var hg = ctx.createRadialGradient(hub[0], hub[1], 0, hub[0], hub[1], R * .36 * hub[3]);
      var bh = arr ? 1 : b;
      hg.addColorStop(0, "rgba(235,242,255," + ((.6 + glow * .4) * bh).toFixed(3) + ")");
      hg.addColorStop(.35, "rgba(" + BLUE + "," + ((.65 + glow * .35) * bh).toFixed(3) + ")");
      hg.addColorStop(1, "rgba(" + BLUE + ",0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hub[0], hub[1], R * .36 * hub[3], 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.beginPath();
      for (var hz = 0; hz <= 40; hz++) { var ha = hz / 40 * Math.PI * 2, hp = Pr(Math.cos(ha) * R * .14, Math.sin(ha) * R * .14, R * .2); hz ? ctx.lineTo(hp[0], hp[1]) : ctx.moveTo(hp[0], hp[1]); }
      ctx.stroke();
      }
      // lampo all'aggancio
      if (flash > .01) { ctx.fillStyle = "rgba(170,205,255," + (flash * .32).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); flash *= .9; }

      // anelli d'energia
      rings = rings.filter(function (r) {
        var t = (now - r.t0) / 1100; if (t > 1) return false;
        ctx.strokeStyle = "rgba(" + BLUE + "," + ((1 - t) * .8).toFixed(3) + ")"; ctx.lineWidth = 1.5;
        ring(R * (.3 + t * 1.6), R * .15, 0, Math.PI * 2, 80); ctx.stroke(); ctx.lineWidth = 1; return true;
      });

      // particelle: arrivano da lontano, entrano a spirale nel rotore
      ctx.font = mobile ? MONO_S : MONO; ctx.textBaseline = "middle";
      var chipH = mobile ? 26 : 32, padX = mobile ? 9 : 12;
      parts = parts.filter(function (p) {
        var t = (now - p.t0) / p.dur;
        if (t >= 1) {
          boost += .5; rings.push({ t0: now }); pulses.push({ k: (Math.random() * 3) | 0, t0: now + 100 });
          return false;
        }
        var te = 1 - Math.pow(1 - t, 2.2);
        var rr = p.r0 * (1 - te) + R * .2 * te, aa = p.a0 + te * p.spin * 2.4 + angle * .15 * te;
        var hh = R * (.02 + .16 * te);
        var q = P(Math.cos(aa) * rr, Math.sin(aa) * rr, hh);
        // scia
        var t2 = Math.max(0, te - .05), rr2 = p.r0 * (1 - t2) + R * .2 * t2, aa2 = p.a0 + t2 * p.spin * 2.4 + angle * .15 * t2;
        var q2 = P(Math.cos(aa2) * rr2, Math.sin(aa2) * rr2, R * (.02 + .16 * t2));
        var inner = rr < R * 1.3;
        ctx.strokeStyle = inner ? "rgba(" + BLUE + ",.7)" : "rgba(244,244,244,.35)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(q2[0], q2[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = inner ? "rgba(" + BLUE + ",1)" : "rgba(244,244,244,.95)";
        ctx.beginPath(); ctx.arc(q[0], q[1], (inner ? 3 : 2.4) * Math.min(1.3, q[3]), 0, Math.PI * 2); ctx.fill();
        var lab = t < .6 ? Math.min(1, t * 6) : Math.max(0, 1 - (t - .6) / .2);
        var tw = ctx.measureText(p.label).width, bx = q[0] + 14, by = q[1] - chipH / 2;
        if (!mobile && bx < textRight + 20) lab *= Math.max(0, (bx - textRight + 120) / 140);
        if (lab > .02 && bx > 0 && by > 0 && bx + tw + padX * 2 < W) {
          ctx.globalAlpha = lab * b;
          ctx.fillStyle = "rgba(12,12,12,.88)"; ctx.fillRect(bx, by, tw + padX * 2, chipH);
          ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.strokeRect(bx + .5, by + .5, tw + padX * 2 - 1, chipH - 1);
          ctx.fillStyle = "#e6e6e6"; ctx.fillText(p.label, bx + padX, by + chipH / 2 + .5);
          ctx.globalAlpha = 1;
        }
        return true;
      });

      // impulsi verso i contatori
      pulses = pulses.filter(function (u) {
        var t = (now - u.t0) / 800; if (t < 0) return true;
        if (t >= 1) { hit(u.k); return false; }
        var o = outPts[u.k]; if (!o) return false;
        var s = P(R * 1.34 * Math.cos(-.4 + u.k * .35), R * 1.34 * Math.sin(-.4 + u.k * .35), R * .16);
        var c1 = [s[0], s[1] + (o.y - s[1]) * .6], c2 = [o.x, s[1] + (o.y - s[1]) * .3];
        ctx.strokeStyle = "rgba(" + BLUE + "," + (.25 * (1 - t)) + ")";
        ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], o.x, o.y); ctx.stroke();
        for (var j = 0; j < 7; j++) {
          var tt = Math.max(0, t - j * .022), w = 1 - tt;
          var px = w * w * w * s[0] + 3 * w * w * tt * c1[0] + 3 * w * tt * tt * c2[0] + tt * tt * tt * o.x;
          var py = w * w * w * s[1] + 3 * w * w * tt * c1[1] + 3 * w * tt * tt * c2[1] + tt * tt * tt * o.y;
          ctx.fillStyle = "rgba(170,205,255," + (1 - j / 7) + ")";
          ctx.beginPath(); ctx.arc(px, py, 2.6 - j * .3, 0, Math.PI * 2); ctx.fill();
        }
        return true;
      });
    }

    var rpmShown = 0;
    function frame(now) {
      if (!running) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (now > startAt) build = Math.min(1, build + dt / 1.8);
      var r = stage.getBoundingClientRect();
      scrollP = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
      var sv = lenisRef() ? Math.min(2.5, Math.abs(lenisRef().velocity || 0) * .04) : 0;
      boost = Math.min(boost, 1.2) * Math.pow(.35, dt);
      var target = Math.min(VMAX, .55 * Math.min(1, build * 1.5) + boost * .5 + hover * .4 + sv * .3);
      speed += (target - speed) * Math.min(1, dt * 2);
      angle += speed * dt * spinMul;
      yaw += (yawT - yaw) * Math.min(1, dt * 2.5);
      tiltNow += ((tilt + pitchT + scrollP * .32) - tiltNow) * Math.min(1, dt * 3);
      roll = -.35 - scrollP * .5;
      if (!hold && build > .7 && now > nextSpawn) { spawn(now); nextSpawn = now + (mobile ? 1300 : 800) + Math.random() * 600; }
      draw(now);
      var rpm = Math.round(speed * 60);
      if (rpmEl && rpm !== rpmShown) { rpmShown = rpm; rpmEl.textContent = rpm; }
      requestAnimationFrame(frame);
    }
    function start() { if (running || reduced || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }

    layout();
    if (reduced) {
      var now = performance.now(); speed = .6; angle = .5; build = 1; glow = .5;
      for (var s = 0; s < 5; s++) { spawn(now - 700 * (s + 1)); }
      draw(now); if (rpmEl) rpmEl.textContent = "36";
    }
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if (finePointer) {
      stage.addEventListener("pointermove", function (ev) {
        var r = stage.getBoundingClientRect();
        yawT = ((ev.clientX - r.left) / r.width - .5) * .28;
        pitchT = ((ev.clientY - r.top) / r.height - .5) * -.12;
        var hb = P(0, 0, 0), dx = ev.clientX - r.left - hb[0], dy = ev.clientY - r.top - hb[1];
        hover = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (R * 1.6));
      });
      stage.addEventListener("pointerleave", function () { yawT = 0; pitchT = 0; hover = 0; });
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(stage);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    start();
  })();

  if (motion) {
    document.documentElement.classList.add("js-motion");
    gsap.registerPlugin(ScrollTrigger);
    /* Apertura. Alla prima visita: logo al centro, il rotore arriva dal fondo e si aggancia,
       il logo vola nell'intestazione. Poi entra il titolo. */
    var intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: .15 });
    var T = 0, introDone = !playIntro;
    function finishIntro() {
      if (introDone) return; introDone = true;
      try { sessionStorage.setItem("dw-intro", "1"); } catch (e) {}
      var box = $("#intro"); if (box && box.parentNode) box.parentNode.removeChild(box);
      document.documentElement.classList.remove("has-intro");
      gsap.set(".site-header", { opacity: 1 });
      if (lenis) lenis.start();
    }
    if (playIntro) {
      T = 3.1;
      var il = $("#intro-logo"), hl = $(".site-header .logo img");
      if (lenis) lenis.stop();
      gsap.set(".site-header", { opacity: 0 });
      intro.fromTo(il, { opacity: 0, scale: .82, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1 }, 0)
        .fromTo(".intro-skip", { opacity: 0 }, { opacity: 1, duration: .6 }, .6)
        .add(function () { if (window.dynCtl) window.dynCtl.arrive(2000); }, .3)
        .to(il, { filter: "drop-shadow(0 0 30px rgba(85,144,247,.95))", duration: .25, ease: "power2.out" }, 2.3)
        .to(".intro-skip", { opacity: 0, duration: .3 }, 2.3)
        .add(function () {
          var a = il.getBoundingClientRect(), b = hl.getBoundingClientRect();
          gsap.to(il, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2),
            scale: b.width / a.width, filter: "drop-shadow(0 0 0px rgba(85,144,247,0))", duration: 1, ease: "expo.inOut" });
        }, 2.45)
        .to(".site-header", { opacity: 1, duration: .35, ease: "power2.out" }, 3.3)
        .add(finishIntro, 3.5);
      var skip = function () {
        if (introDone) return;
        intro.progress(1);
        if (window.dynCtl) window.dynCtl.skip();
        finishIntro();
      };
      $("#intro").addEventListener("click", skip);
      window.addEventListener("wheel", skip, { passive: true, once: true });
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("touchmove", skip, { passive: true, once: true });
    }
    intro.from(".hero .meta-row .meta", { opacity: 0, y: 10, duration: .8, stagger: .1 }, T)
      .from(".hero h1 .w", { yPercent: 110, opacity: 0, filter: "blur(16px)", duration: 1.4, stagger: .09 }, T + .2)
      .from(".hero-lead, .hero-actions", { opacity: 0, y: 24, duration: 1.1, stagger: .12 }, T + .9)
      .from(".hud-cap, .hud-right > .meta", { opacity: 0, duration: .8, stagger: .15 }, T + 1.2)
      .from(".dyn-out li", { opacity: 0, y: 16, duration: .9, stagger: .12 }, T + 1.5)
      .from(".trust, .stats .stat", { opacity: 0, y: 20, duration: 1, stagger: .08 }, T + 1.4);

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
