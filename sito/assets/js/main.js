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

  if (motion) {
    document.documentElement.classList.add("js-motion");
    gsap.registerPlugin(ScrollTrigger);
    /* Apertura: il titolo entra parola per parola, poi la scena racconta una giornata */
    var q = $("#q"), qText = q ? q.textContent : "";
    var reply = $("#reply"), replyText = reply ? reply.textContent : "";
    var intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: .15 });
    intro.from(".hero .meta-row .meta", { opacity: 0, y: 10, duration: .8, stagger: .1 }, 0)
      .from(".hero h1 .w", { yPercent: 110, opacity: 0, filter: "blur(14px)", duration: 1.3, stagger: .07 }, .1)
      .from(".hero-lead, .hero-actions", { opacity: 0, y: 24, duration: 1.1, stagger: .12 }, .9)
      .from(".scene-cap", { opacity: 0, duration: .8 }, 1.0)
      // 1. il sito: compare la finestra e si digita il codice
      .from(".c-site", { opacity: 0, y: 40, rotateX: 18, duration: 1.2 }, 1.0)
      .add(function () { if (q) q.textContent = ""; }, 1.0)
      .to({ n: 0 }, { n: qText.length, duration: .6, ease: "none", onUpdate: function () { if (q) q.textContent = qText.slice(0, Math.round(this.targets()[0].n)); } }, 1.5)
      .from(".c-site .result", { opacity: 0, x: -12, duration: .6, stagger: .12 }, 2.0)
      // 2. l'agente risponde
      .fromTo("#w1", { strokeDashoffset: 60, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: .8, ease: "power2.out" }, 2.3)
      .from(".c-chat", { opacity: 0, y: 30, scale: .96, duration: 1 }, 2.5)
      .from(".c-chat .bub.in", { opacity: 0, y: 8, duration: .5 }, 2.7)
      .add(function () { if (reply) reply.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; }, 3.0)
      .add(function () { if (reply) reply.textContent = replyText; }, 3.6)
      .from(".c-chat .bub.out", { opacity: 0, y: 8, duration: .5 }, 3.0)
      // 3. l'automazione lavora
      .fromTo("#w2", { strokeDashoffset: 60, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: .8, ease: "power2.out" }, 3.8)
      .from(".c-flow", { opacity: 0, y: 30, duration: 1 }, 4.0)
      .from(".c-flow li", { opacity: 0, x: -10, duration: .45, stagger: .3 }, 4.3)
      // 4. il mattino dopo, LeadRaptor segnala un'azienda
      .fromTo("#w3", { strokeDashoffset: 60, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: .8, ease: "power2.out" }, 5.2)
      .from(".c-lead", { opacity: 0, y: -24, scale: .94, duration: 1.1, ease: "back.out(1.6)" }, 5.4)
      .from(".trust, .stats .stat", { opacity: 0, y: 20, duration: 1, stagger: .08 }, 1.4);

    /* Profondità: le schede si spostano a strati col mouse e scorrendo */
    var depth = { ".c-site": 10, ".c-flow": 18, ".c-chat": 28, ".c-lead": 38 };
    if (finePointer && window.matchMedia("(min-width: 961px)").matches) {
      var movers = Object.keys(depth).map(function (s) {
        return { k: depth[s], x: gsap.quickTo(s, "x", { duration: 1, ease: "power3" }), y: gsap.quickTo(s, "y", { duration: 1, ease: "power3" }) };
      });
      $(".hero").addEventListener("pointermove", function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        movers.forEach(function (m) { m.x(nx * m.k); m.y(ny * m.k * .7); });
      });
      Object.keys(depth).forEach(function (s) {
        gsap.to(s, { yPercent: -depth[s] * .9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 } });
      });
    }

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
