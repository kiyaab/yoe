FROM alpine:3.19

RUN apk add --no-cache \
    postgresql16-client \
    gzip \
    bash \
    tzdata \
    findutils

ENV TZ=UTC

WORKDIR /

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

# Run backup daily at 02:00 UTC
RUN echo "0 2 * * * /backup.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

RUN mkdir -p /backups /var/log && touch /var/log/cron.log

# Run once on startup, then keep crond in foreground
CMD ["sh", "-c", "/backup.sh && crond -f -l 2"]
