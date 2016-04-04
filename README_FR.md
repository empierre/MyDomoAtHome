# MyDomoAtHome nodeJS
Interface RESTentre Domoticz et Imperihome ISS

[![NPM Version][npm-image]][npm-url]
![NPM](https://img.shields.io/npm/dm/node-mydomoathome.svg)
![REST](https://travis-ci.org/empierre/MyDomoAtHome.svg?branch=nodejs)
![DOCKER](https://img.shields.io/docker/pulls/epierre/iss-mdah.svg)
![DOCKER](https://img.shields.io/docker/stars/epierre/iss-mdah.svg)
[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")

![LICENSE](https://img.shields.io/github/license/empierre/MyDomoAtHome.svg)
![MP](https://img.shields.io/badge/Platform-Independant-green.svg)
![REST](https://img.shields.io/badge/REST_API-powered-green.svg)
![REST](https://img.shields.io/badge/RPI-tested_ok-green.svg)
![REST](https://img.shields.io/badge/Odroid-tested_ok-green.svg)
![REST](https://img.shields.io/badge/Intel-tested_ok-green.svg)

![MyDomoAtHome](http://domoticz.com/wiki/images/f/f1/Imperihome2.png "MyDomoAtHome ISS")

# Objectif et buts
Le but de ce projet est de fournir une interface API REST API entre Domoticz et ImperiHome ISS pour piloter sa domotique.

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M1 Goal reached - first version in Perl Dancer after ISS has been announced

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M2 Goal reached - full rewrite to node js with debian packaging, simpler install and upgrade, better performance, less dependencies
- [X] Free
- [X] Multi-platform (Linux, Mac OS X, Windows)
  - [X] Dependency-less 
  - [X] Node.js rewrite
  - [X] Installation / usage logs
- [X] Debian package - noarch
  - [X] Auto updatable through apt-get
  - [X] Third-party hosting
- [X] Micro-services (Docker)
  - [X] Image available on Docker Hub
- [X] Synology
  - [X] Synology compatible docker image
- [X] Support major type of sensors/feature of Domoticz
  - [X] Weather and Environmental sensors  
  - [X] Energy sensors (Electricity, Gas, Water)
  - [X] Switches
  - [X] Thermostat
  - [X] Dynamic room creation
  - [X] RGB lamps (Limitless/Applamp/Hue) (depending on Domoticz)
  - [X] Push On buttons (depending on Imperihome)

M3 milestone will provide extended support to other platforms with Docker and Synology 
- [ ] Synology
  - [ ] Synology hosted package
- [ ] Debian package - noarch
  - [ ] debian hosted package - need a peer
  - [ ] raspbian hosted package
- [ ] Support major type of sensors/feature of Domoticz
  - [ ] Devices following planID
  - [ ] Graphs
- TODO
  - [ ] Evohome (depending on Imperihome)
  - [ ] Alarm pannel (partial with ImperiHome)
  - [ ] End to end authentificaton
  - [ ] Auto updatable through button

[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")



# Installation (PI, cubie, odroid, intel...)

## Procéure d'installation

### Vérification de la version de node J - obligatoire sur le PI !

    sudo dpkg --list |grep nodejs // should return version 4.x or above

Dans le cas contraire:

Sur RASPBIAN (Raspberry PI/PI2/PI3), installer le nodeJS suivant pour avoir une version stable:

    sudo apt-get remove node
    wget -q http://www.e-nef.com/domoticz/mdah/nodejs_4.4.2_armhf.deb
    sudo dpkg -i nodejs_4.4.2_armhf.deb
    wget -q http://www.e-nef.com/domoticz/mdah/npm_2.14.7_armhf.deb
    sudo dpkg -i npm_2.14.7_armhf.deb
    sudo npm install -g npm@2.x

Sur toutes les autres, une version 4 est nécessaire (testing/unstable ok):

    sudo apt-get remove node
    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs
  
   La commande suivante installe npm et l'upgrade à la version 2.x.
  
    sudo npm install -g npm@2.x
  
  Note: npm version 3 est la dernière version, mais n'est pas recommandée en production actuellement.

Et on vérifie à nouveau:

    node —version // should print version 4.4.x or similar
    npm —version // should print version 2.2.x or similar

### Installation du package Debian .deb

    wget -qO - http://www.e-nef.com/domoticz/mdah/gpg.key | sudo apt-key add -
    sudo nano /etc/apt/sources.list
   
  Ajoutez la ligne:
  
    deb http://www.e-nef.com/domoticz/mdah/ /

  Puis:

    sudo apt-get update
    sudo apt-get install MyDomoAtHome 

  Remarque importante: ne pas installer en tant que root, mais un utilisateur sans privilège (e.g. pi user)

  editez /etc/mydomoathome/config.json avec vos paramètres
  
     sudo service mydomoathome restart
  
### si vous restez sur une version pre 0.1.x

    apt-get remove mydomoathome
    apt-get update
    apt-get install MyDomoAtHome
  
### Migrating from old/Legacy MyDomoAtHome

Shut down the old service

    sudo service MyDomoAtHome.sh stop
    rm /etc/init.d/MyDomoAtHome.sh
  
N.B. you can have the both at the same time, just chane the App name in the config.json file and the port.

### Migrating from ISS-DOMO

  edit /etc/mydomoathome/config.json with your previous port (was 8000 default), change app_name value to ISS-Domo
  and then restart the service

## Running the service

The default port is now 3002.

### Start the service:

    sudo service mydomoathome start

### Stop the service :

    sudo service mydomoathome stop

### Restart the service :

    sudo service mydomoathome reload

## Docker installation (only for those using this form: big synologies, Xpenologies...)
Docker image is automatically build based on latest verion.
Configuration can be passed through command line (see below) /etc/mydomoathome is also mounted

### Duplicate the image

    docker pull epierre/iss-mdah
    
### Launch the process
Remember to change the IP below and authorize in Domoticz the docker IP range

    docker run --name=mdah --env DOMO="http://your_ip:8080" --env TZ=Europe/Paris -p 3002:3002 epierre/mdah

### Check running docker processes

    docker ps
    
### Stoping a docker process

    docker stop mdah 
  
# Testing the installation
  - Check in a browser it is running:
    http://gateway_ip:gateway_port/
  
  - From there you'll get the following links in the browser.

  - Check the domoticz is accessible from the hosting machine:

    curl http://domoticz_ip:domoticz_port/json.htm?type=devices&filter=all&used=true&order=Name

  - Check the MDAH returns the result from the hosting machine:

    curl http://gateway_ip:gateway_port/devices
  
# Support: 
  - Tracking: https://github.com/empierre/MyDomoAtHome/issues
  - English : http://www.domoticz.com/forum/viewtopic.php?f=21&t=6882
  - French  : http://easydomoticz.com/forum/viewtopic.php?f=12&t=573
  - Send domoticz.db for an undetected device: domoticz at e-nef.com

# Q&A
  - Remember to add the gateway in the local networks under setup in domoticz !

[npm-image]: https://img.shields.io/npm/v/node-mydomoathome.svg?style=flat
[npm-url]: https://npmjs.org/package/node-mydomoathome
[travis-image]: https://travis-ci.org/empierre/MyDomoAtHome.svg
[travis-url]: https://travis-ci.org/empierre/MyDomoAtHome
