# Dinamoweb — nuovo sito dinamoweb.com

Anteprima: https://dinamoweb.dinamoai.it (noindex, password facoltativa).
Deploy: app Coolify con GitHub App easy-emu, branch `main`: ogni `git push` pubblica da solo.

## Struttura
- `sito/` — il sito statico (è la radice web)
  - `index.html`, `chi_siamo.html`, `ecosistema.html`, `archivio.html`
    (raggiungibili anche senza `.html`: `/chi_siamo`)
  - `404.html` — pagina non trovata
  - `assets/css`, `assets/js`, `assets/img` — risorse condivise (cache 7 giorni)
- `Dockerfile` + `nginx/` — nginx:alpine su Coolify.
  - Password: variabili Coolify `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD`
    (se vuote il sito è aperto). Valori in `dinamoai/segreti/dinamoweb.env`, mai nel repo.

Il repo è pubblico: niente segreti, chiavi o dati di clienti nei file.

## Lavorare
    cd /Volumes/Asterix/Siti/dinamoai/dinamoweb
    git add -A && git commit -m "..." && git push

## Al lancio su dinamoweb.com
- togliere `X-Robots-Tag noindex` e il `robots.txt` Disallow in `nginx/default.conf`
- aggiungere il dominio in Coolify e puntare il DNS di dinamoweb.com al VPS 5.189.156.146
