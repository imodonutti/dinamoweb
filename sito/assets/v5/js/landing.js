/* Dinamoweb v5 — script delle pagine servizio / landing (leggero, senza librerie) */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var q = new URLSearchParams(location.search);
  var lp = document.documentElement.classList.contains("is-lp");

  // nella versione campagne si nasconde il link alla versione stessa
  if (lp) $$('a[href^="?"]').forEach(function (a) { a.style.display = "none"; });

  // titolo con la città dell'annuncio: ?citta=Cremona (qualunque città, solo lettere)
  var raw = (q.get("citta") || "").trim();
  if (/^[A-Za-zÀ-ÿ' -]{2,30}$/.test(raw)) {
    var c = raw.toLowerCase().replace(/(^|[\s'-])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    $$(".lp-city").forEach(function (el) { el.textContent = " a " + c; });
    document.title = c + " · " + document.title;
  }

  // header: sfondo quando si scorre, menu su telefono
  var header = $(".site-header"), toggle = $("#menu-toggle");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 10);
    var bar = $("#lp-bar"), form = $("#preventivo");
    if (bar && form) {
      var fr = form.getBoundingClientRect();
      bar.classList.toggle("on", window.scrollY > window.innerHeight * .6 && fr.top > window.innerHeight * .9);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (toggle) toggle.addEventListener("click", function () {
    var open = header.classList.toggle("open"); toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { header.classList.remove("open"); }); });

  // i pulsanti dei pacchetti preselezionano la scelta nel modulo
  var pick = function (v) { var r = $('#lp-form input[name="pacchetto"][value="' + v + '"]'); if (r) r.checked = true; };
  $$("[data-pack]").forEach(function (a) { a.addEventListener("click", function () { pick(a.getAttribute("data-pack")); }); });
  if (q.get("pacchetto")) pick(q.get("pacchetto"));

  // modulo: controllo minimo (prototipo: non invia ancora)
  var form = $("#lp-form"), status = $("#lp-status");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("#f-nome").value.trim(), cont = $("#f-contatto").value.trim();
    if (!nome || !cont) { status.textContent = "Ci servono almeno il nome e un telefono o un'email."; (nome ? $("#f-contatto") : $("#f-nome")).focus(); return; }
    status.textContent = "Grazie " + nome.split(" ")[0] + ", ti rispondiamo entro un giorno lavorativo. (Prototipo: il modulo non invia ancora.)";
    form.querySelector("button").disabled = true;
  });
})();
