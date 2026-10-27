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

  /* ---------- Il seme dell'apertura ----------
     Un seme sotto terra riceve punti di luce (i dati), mette radici a forma
     di circuito, germoglia e sboccia nel rosso Dinamoweb. Lo scroll fa
     crescere la pianta; tornando su, il fiore si richiude in seme. */
  var canvas = $("#film"), ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1, mobile = false;
  var target = 0, shown = 0, t0 = performance.now();

  function mix(a, b, k) { return a + (b - a) * k; }
  function clamp(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function ease(k) { k = clamp(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function out(k) { k = clamp(k); return 1 - Math.pow(1 - k, 3); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function ramp(stops, p) {
    p = clamp(p);
    var n = stops.length - 1, i = Math.min(n - 1, Math.floor(p * n)), k = ease(p * n - i);
    var a = hex(stops[i]), b = hex(stops[i + 1]);
    return [Math.round(mix(a[0], b[0], k)), Math.round(mix(a[1], b[1], k)), Math.round(mix(a[2], b[2], k))];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  /* numeri pseudo-casuali ripetibili: la pianta è sempre la stessa */
  function rng(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* radici a circuito: tratti verticali e diagonali con un nodo in fondo */
  var roots = (function () {
    var r = rng(7), list = [];
    function branch(x, y, dir, depth, start) {
      var pts = [[x, y]], len = 3 + Math.floor(r() * 3);
      for (var i = 0; i < len; i++) {
        var down = .55 + r() * .5;
        if (i % 2) { x += dir * down * .8; y += down * .8; } else { y += down; }
        pts.push([x, y]);
      }
      list.push({ pts: pts, start: start, end: start + .16 + r() * .1, depth: depth });
      if (depth < 2) {
        var j = 1 + Math.floor(r() * (pts.length - 2));
        branch(pts[j][0], pts[j][1], -dir, depth + 1, start + .05 + r() * .06);
        if (r() > .45) branch(pts[j + 1 > pts.length - 1 ? j : j + 1][0], pts[j][1] + .3, dir, depth + 1, start + .09);
      }
    }
    branch(0, 0, -1, 0, .1); branch(0, 0, 1, 0, .12); branch(0, 0, .3, 1, .14);
    list.forEach(function (b) { b.pts = b.pts.map(function (q) { return [q[0] * .75, q[1] * .62]; }); });
    return list;
  })();

  /* punti di luce che arrivano al seme */
  var motes = (function () {
    var r = rng(11), a = [];
    for (var i = 0; i < 26; i++) a.push({ ang: r() * Math.PI * 2, dist: .6 + r() * .9, delay: r() * .6, size: .6 + r() * 1.2 });
    return a;
  })();
  var pollen = (function () {
    var r = rng(23), a = [];
    for (var i = 0; i < 18; i++) a.push({ x: (r() - .5) * 2, sp: .4 + r() * .8, ph: r() * 6.28, size: .8 + r() * 1.6 });
    return a;
  })();

  function resize() {
    var rc = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = W < 760;
  }

  function leaf(x, y, ang, len, k, flip) {
    if (k <= 0) return;
    var L = len * out(k), w = L * .42;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1, flip);
    var g = ctx.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, "#5F7A55"); g.addColorStop(1, "#9DB487");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * .3, -w, L * .75, -w * .9, L, 0);
    ctx.bezierCurveTo(L * .7, w * .35, L * .3, w * .4, 0, 0); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L * .08, -1); ctx.quadraticCurveTo(L * .5, -w * .35, L * .92, -1); ctx.stroke();
    ctx.restore();
  }

  function petal(L, w, c0, c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, -L);
    g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w, -L * .25, -w * .95, -L * .82, 0, -L);
    ctx.bezierCurveTo(w * .95, -L * .82, w, -L * .25, 0, 0); ctx.fill();
    ctx.strokeStyle = "rgba(255,240,230,.28)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -L * .12); ctx.lineTo(0, -L * .8); ctx.stroke();
  }

  function flower(fx, fy, S, k, time) {
    /* k: 0 bocciolo chiuso, 1 fiore aperto */
    var layers = [
      { n: 8, L: S, w: S * .36, rot: 0, c: ["#8E2A38", "#CD4D52", "#F08F78"] },
      { n: 8, L: S * .72, w: S * .3, rot: Math.PI / 8, c: ["#9E2F3C", "#DA5A55", "#F7B08E"] },
      { n: 6, L: S * .45, w: S * .22, rot: .2, c: ["#B23A45", "#E7705C", "#FFD0B0"] }
    ];
    for (var l = 0; l < layers.length; l++) {
      var Ly = layers[l], open = ease(seg(k, l * .12, .75 + l * .08));
      for (var i = 0; i < Ly.n; i++) {
        var final = Ly.rot + i * Math.PI * 2 / Ly.n + Math.sin(time * .7 + i) * .015;
        var closed = (i / (Ly.n - 1) - .5) * .5;               /* petali raccolti verso l'alto */
        var a = mix(closed, final, open);
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(a);
        petal(Ly.L * mix(.55, 1, open), Ly.w * mix(.55, 1, open), Ly.c[0], Ly.c[1], Ly.c[2]);
        ctx.restore();
      }
    }
    /* cuore del fiore */
    var hk = seg(k, .55, 1);
    if (hk > 0) {
      var cr = S * .2 * out(hk);
      var cg = ctx.createRadialGradient(fx - cr * .3, fy - cr * .3, 0, fx, fy, cr * 1.6);
      cg.addColorStop(0, "rgba(255,236,200,1)"); cg.addColorStop(.5, "rgba(244,180,140,1)"); cg.addColorStop(1, "rgba(244,180,140,0)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(fx, fy, cr * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,246,232," + hk + ")";
      for (var s = 0; s < 14; s++) {
        var aa = s * 2.399, rr = cr * Math.sqrt((s + .5) / 14);
        ctx.beginPath(); ctx.arc(fx + Math.cos(aa) * rr, fy + Math.sin(aa) * rr, Math.max(1, S * .018), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function draw(p, time) {
    if (!W) return;
    var bloom = seg(p, .62, 1);

    /* fondo crema, con una luce calda che sale dietro la pianta */
    ctx.fillStyle = "#F6F0EA"; ctx.fillRect(0, 0, W, H);
    var px = mobile ? W * .66 : W * .7;
    var ground = mobile ? H * .33 : H * .7;
    var stemH = mobile ? H * .17 : H * .36;
    var grow = out(seg(p, .2, .66));
    var tipY = ground - stemH * grow;
    var lightY = mix(ground, tipY, .6);
    var lr = (mobile ? W * .9 : Math.min(W, H) * .9) * mix(.45, 1.1, ease(p));
    var light = ctx.createRadialGradient(px, lightY, 0, px, lightY, lr);
    var lc = ramp(["#F3D9C4", "#F4C3A0", "#F2A884", "#EE9478"], p);
    light.addColorStop(0, rgba(lc, mix(.5, .85, p))); light.addColorStop(1, rgba(lc, 0));
    ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);

    /* terra: una linea sottile e un sottosuolo appena più scuro */
    var soil = ctx.createLinearGradient(0, ground, 0, H);
    soil.addColorStop(0, "rgba(120,80,64,.10)"); soil.addColorStop(1, "rgba(120,80,64,0)");
    ctx.fillStyle = soil; ctx.fillRect(0, ground, W, H - ground);
    var gl = ctx.createLinearGradient(px - W * .45, 0, px + W * .45, 0);
    gl.addColorStop(0, "rgba(94,60,50,0)"); gl.addColorStop(.5, "rgba(94,60,50,.35)"); gl.addColorStop(1, "rgba(94,60,50,0)");
    ctx.fillStyle = gl; ctx.fillRect(px - W * .45, ground, W * .9, 1);

    var U = mobile ? W * .055 : Math.min(W, H) * .055;  /* unità di misura della pianta */
    var seedY = ground + U * .9;

    /* punti di luce verso il seme (i dati che nutrono l'AI) */
    var mk = 1 - seg(p, .18, .3);
    if (mk > 0) {
      for (var m = 0; m < motes.length; m++) {
        var o = motes[m], cyc = ((time * .18 + o.delay + p * 2) % 1);
        var d = o.dist * U * 6 * (1 - cyc);
        var x = px + Math.cos(o.ang) * d, y = seedY + Math.sin(o.ang) * d * .6;
        ctx.fillStyle = "rgba(205,77,82," + (mk * Math.sin(cyc * Math.PI) * .8).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, o.size * (mobile ? 1.2 : 1.6), 0, Math.PI * 2); ctx.fill();
      }
    }

    /* radici a circuito */
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (var b = 0; b < roots.length; b++) {
      var rt = roots[b], k = seg(p, rt.start, rt.end);
      if (k <= 0) continue;
      var pts = rt.pts, total = pts.length - 1, upto = k * total;
      ctx.strokeStyle = "rgba(158,47,60," + (.55 - rt.depth * .12) + ")";
      ctx.lineWidth = Math.max(1, (mobile ? 1.6 : 2.2) - rt.depth * .5);
      ctx.beginPath(); ctx.moveTo(px + pts[0][0] * U, seedY + pts[0][1] * U);
      var last = pts[0];
      for (var q = 1; q <= Math.ceil(upto); q++) {
        var f = Math.min(1, upto - (q - 1)), a0 = pts[q - 1], a1 = pts[q];
        last = [mix(a0[0], a1[0], f), mix(a0[1], a1[1], f)];
        ctx.lineTo(px + last[0] * U, seedY + last[1] * U);
      }
      ctx.stroke();
      if (k > .98) {
        ctx.fillStyle = "#CD4D52";
        ctx.beginPath(); ctx.arc(px + last[0] * U, seedY + last[1] * U, mobile ? 2.2 : 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(205,77,82,.18)";
        ctx.beginPath(); ctx.arc(px + last[0] * U, seedY + last[1] * U, mobile ? 5 : 7, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* il seme: si apre quando parte il germoglio */
    var crack = seg(p, .14, .26), seedFade = 1 - seg(p, .4, .6) * .6;
    var glow = ctx.createRadialGradient(px, seedY, 0, px, seedY, U * 2.2);
    glow.addColorStop(0, "rgba(240,143,120," + (.55 * seedFade) + ")"); glow.addColorStop(1, "rgba(240,143,120,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, seedY, U * 2.2, 0, Math.PI * 2); ctx.fill();
    for (var h = -1; h <= 1; h += 2) {
      ctx.save(); ctx.translate(px + h * crack * U * .18, seedY); ctx.rotate(h * crack * .35);
      var sg = ctx.createLinearGradient(-U * .5, -U * .8, U * .5, U * .8);
      sg.addColorStop(0, "#E2826A"); sg.addColorStop(.5, "#B23A45"); sg.addColorStop(1, "#6E2230");
      ctx.fillStyle = sg; ctx.globalAlpha = seedFade;
      ctx.beginPath();
      ctx.moveTo(0, -U * .85);
      ctx.bezierCurveTo(h * U * .75, -U * .6, h * U * .7, U * .55, 0, U * .8);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,226,207," + (.6 * seedFade) + ")";
    ctx.beginPath(); ctx.ellipse(px - U * .18, seedY - U * .35, U * .1, U * .22, -.3, 0, Math.PI * 2); ctx.fill();

    /* stelo */
    if (grow > 0) {
      var sway = Math.sin(time * .6) * U * .12 * grow;
      var tipX = px + sway + U * .25 * Math.sin(grow * 2.4);
      ctx.strokeStyle = "#6F8A60"; ctx.lineWidth = mobile ? 3 : 4.5;
      ctx.beginPath(); ctx.moveTo(px, seedY - U * .6);
      ctx.bezierCurveTo(px - U * .6, mix(ground, tipY, .35), px + U * .7, mix(ground, tipY, .7), tipX, tipY);
      ctx.stroke();

      /* foglie */
      var Lf = mobile ? W * .13 : Math.min(W, H) * .17;
      var y1 = mix(ground, tipY, .3), y2 = mix(ground, tipY, .55);
      leaf(px - U * .12, y1, -.5 + Math.sin(time * .5) * .04, Lf, seg(p, .3, .48), 1);
      leaf(px + U * .2, y2, Math.PI + .55 + Math.sin(time * .5 + 1) * .04, Lf * .85, seg(p, .4, .56), -1);

      /* bocciolo e fiore */
      var bud = out(seg(p, .48, .64));
      if (bud > 0) {
        var S = (mobile ? W * .14 : Math.min(W, H) * .17) * mix(.45, 1, bud) * mix(.85, 1.15, bloom);
        /* alone del fiore */
        var fg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, S * 2.6);
        fg.addColorStop(0, "rgba(242,160,122," + (.45 * bloom) + ")"); fg.addColorStop(1, "rgba(242,160,122,0)");
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(tipX, tipY, S * 2.6, 0, Math.PI * 2); ctx.fill();
        flower(tipX, tipY, S, bloom, time);

        /* polline che sale */
        var pk = seg(p, .85, 1);
        if (pk > 0) {
          for (var z = 0; z < pollen.length; z++) {
            var pl = pollen[z], c = (time * pl.sp * .12 + pl.ph) % 1;
            var zx = tipX + pl.x * S * 1.4 + Math.sin(time + pl.ph) * 6, zy = tipY - S * .4 - c * S * 2.4;
            ctx.fillStyle = "rgba(244,180,140," + (pk * Math.sin(c * Math.PI) * .9).toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(zx, zy, pl.size, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    /* velo per la leggibilità del testo */
    var veil = mobile ? ctx.createLinearGradient(0, H, 0, H * .36) : ctx.createLinearGradient(0, 0, W * .6, 0);
    veil.addColorStop(0, "rgba(246,240,234,1)"); veil.addColorStop(.55, "rgba(246,240,234,.9)"); veil.addColorStop(1, "rgba(246,240,234,0)");
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
