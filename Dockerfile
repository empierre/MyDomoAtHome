# DOCKER-VERSION 0.3.4
#FROM ubuntu:13.10
FROM node:4-slim
MAINTAINER  Emmanuel PIERRE epierre@e-nef.com
USER root

##################################################
# Set environment variables                      #
##################################################

# Ensure UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

ENV DEBIAN_FRONTEND noninteractive
ENV TERM xterm

##################################################
# Install tools                                  #
##################################################

RUN apt-get update --fix-missing
RUN apt-get install -yq curl
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get install tzdata
RUN apt-get -y install npm nodejs git git-core

##################################################
# Install MDAH                                   #
##################################################

RUN cachebuster=b953b35 git clone -b nodejs https://github.com/empierre/MyDomoAtHome.git dist
#RUN cd MyDomoAtHome && bash run-once.sh
COPY . /src
RUN cd /src/dist; npm install
#RUN npm install node-mydomoathome

##################################################
# Start                                          #
##################################################

EXPOSE 3002

WORKDIR dist 
ADD     . dist
RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
  npm install -g forever nodemon mocha supervisor
CMD ["forever", "/src/mdah.js"]
