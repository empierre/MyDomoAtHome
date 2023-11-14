# DOCKER-VERSION 0.3.4
FROM node:current-bookworm-slim
#FROM google/nodejs
#FROM node:4.4-wheezy
MAINTAINER  Emmanuel PIERRE epierre@e-nef.com
USER root
LABEL Description="This image is used to start the MyDomoAtHome executable" Vendor="Domoticz" Version="0.3.2"

##################################################
# Install tools                                  #
##################################################

RUN apt-get update --fix-missing
RUN apt-get -y install sudo
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
RUN apt-get install -yq curl
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get install tzdata
RUN apt-get -y install git git-core
RUN apt-get -y install wget curl 

##################################################
# Set environment variables                      #
##################################################

RUN apt-get install -yq apt-utils
RUN apt-get install debconf
RUN apt-get update -qq && apt-get install -y locales -qq && locale-gen en_US.UTF-8 en_us && dpkg-reconfigure locales && dpkg-reconfigure locales && locale-gen C.UTF-8 && /usr/sbin/update-locale LANG=C.UTF-8
# Ensure UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8
ENV DEBIAN_FRONTEND noninteractive
ENV TERM xterm
ENV CONTAINER yes

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
#RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install -y nodejs
#RUN apt-get install -y npm
RUN npm install -g npm@6.x
RUN wget http://www.e-nef.com/domoticz/mdah/node-mydomoathome-0.3.4.deb
RUN dpkg --force-all -i node-mydomoathome-0.3.2.deb
RUN mv /etc/mydomoathome/config.json /etc/mydomoathome/config.json.old
VOLUME /etc/mydomoathome/

##################################################
# Start                                          #
##################################################

EXPOSE 3002

WORKDIR dist 
ADD . dist
RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
  npm install -g forever nodemon mocha supervisor
#CMD ["forever", "start","--minUptime 1000 --spinSleepTime 1000 --max-old-space-size=128", "/usr/share/mydomoathome/app/mdah.js"]
RUN cd /usr/share/mydomoathome/app/
CMD ["forever", "/usr/share/mydomoathome/app/mdah.js"]
