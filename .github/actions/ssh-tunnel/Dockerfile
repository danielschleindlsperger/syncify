FROM debian:stable

RUN apt-get update -y
RUN apt-get -y install sshpass

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]