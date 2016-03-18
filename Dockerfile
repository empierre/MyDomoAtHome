# DOCKER-VERSION 0.3.4
#FROM ubuntu:14.10
#FROM node:4-slim
#FROM google/nodejs
FROM node:4.4-wheezy
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
RUN apt-get -y install sudo
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
RUN apt-get install -yq curl
RUN apt-get install -yq apt-utils
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get install tzdata
RUN apt-get -y install git git-core
RUN apt-get -y install wget curl

##################################################
# Install MDAH                                   #
##################################################
# Set the time zone
RUN echo "Europe/Paris" > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata
#VOLUME /etc/timezone /etc/localtime

##################################################
# Install MDAH                                   #
##################################################

#RUN cachebuster=b953b35 git clone -b nodejs https://github.com/empierre/MyDomoAtHome.git dist
#RUN cd MyDomoAtHome && bash run-once.sh
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -y nodejs
#RUN apt-get install npm
RUN npm install -g npm@2.x
RUN wget http://www.e-nef.com/domoticz/mdah/node-mydomoathome-latest.deb
RUN dpkg -i   node-mydomoathome-latest.deb

##################################################
# Start                                          #
##################################################

EXPOSE 3002

WORKDIR dist 
ADD . dist
RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
  npm install -g forever nodemon mocha supervisor
CMD ["forever", "/usr/share/mydomoathome/app/mdah.js"]
