# DOCKER-VERSION 0.3.4
#FROM        perl:latest
FROM ubuntu:latest
MAINTAINER  Emmanuel PIERRE epierre@e-nef.com
USER root
RUN apt-get update
RUN apt-get -y install npm
#RUN cachebuster=b953b35 git clone http://github.com/empierre/MyDomoAtHome.git
#RUN cd MyDomoAtHome && bash run-once.sh

npm install mydomoathome

EXPOSE 3002

WORKDIR MyDomoAtHome
CMD node mdah.js
