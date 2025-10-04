FROM nginx:stable-alpine

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/*.conf /etc/nginx/conf.d/

RUN mkdir -p /var/cache/nginx /var/www/app1/static /var/www/app2/static
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/acces.log /var/log/nginx/error.log && \
    chown -R nginx:nginx /var/log/nginx


EXPOSE 80

CMD ["nginx", "-g", "daemon off"]