# DOCKER-VERSION 0.3.4
#FROM ubuntu:13.10
FROM node:4-slim
MAINTAINER  Emmanuel PIERRE epierre@e-nef.com
USER root

RUN apt-get update --fix-missing
RUN apt-get install -yq curl
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get -y install npm nodejs git git-core
RUN cachebuster=b953b35 git clone -b nodejs https://github.com/empierre/MyDomoAtHome.git dist
#RUN cd MyDomoAtHome && bash run-once.sh
COPY . /src
RUN cd /src; npm install
#RUN npm install node-mydomoathome

EXPOSE 3002

WORKDIR dist 
ADD     . dist
RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
  npm install -g forever nodemon mocha supervisor
CMD ["forever", "/src/mdah.js"]
