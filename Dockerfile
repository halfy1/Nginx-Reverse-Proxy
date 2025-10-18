FROM nginx:1.25-alpine

RUN apk add --no-cache curl

RUN mkdir -p /var/cache/nginx/app1 \
    && mkdir -p /var/cache/nginx/app2 \
    && chown -R nginx:nginx /var/cache/nginx

RUN mkdir -p /var/log/nginx \
    && chown -R nginx:nginx /var/log/nginx

RUN mkdir -p /var/www/app1/static \
    && mkdir -p /var/www/app1/media \
    && mkdir -p /var/www/app2/static \
    && chown -R nginx:nginx /var/www

EXPOSE 80 443 8080

CMD ["nginx", "-g", "daemon off;"]