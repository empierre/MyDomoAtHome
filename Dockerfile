# DOCKER-VERSION 0.3.4
#FROM ubuntu:13.10
FROM node:4-onbuild
MAINTAINER  Emmanuel PIERRE epierre@e-nef.com
USER root
RUN apt-get update
RUN apt-get -y install npm nodejs git git-core
#RUN cachebuster=b953b35 git clone http://github.com/empierre/MyDomoAtHome.git
#RUN cd MyDomoAtHome && bash run-once.sh
COPY . /src
RUN cd /src; npm install
RUN npm install mydomoathome

EXPOSE 3002

WORKDIR MyDomoAtHome
CMD ["node", "/src/mdah.js"]
