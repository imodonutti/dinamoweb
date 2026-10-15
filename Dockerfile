# Dinamoweb - nuovo sito dinamoweb.com, servito da nginx.
FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY --chmod=644 nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 nginx/40-basic-auth.sh /docker-entrypoint.d/40-basic-auth.sh

RUN rm -f /usr/share/nginx/html/*
COPY sito/ /usr/share/nginx/html/
# i file creati sul Mac sono spesso 600: nginx deve poterli leggere
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
 && find /usr/share/nginx/html -type f -exec chmod 644 {} +

EXPOSE 80
