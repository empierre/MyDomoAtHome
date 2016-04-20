# MyDomoAtHome nodeJS
Imperihome http://www.evertygo.com/imperihome est une application mobile (Android/iOS) qui s'interface à de nombreuses solutions domotiques et autres objets connectés. Cette application est multi-instances, permet une gestion fine et belle des éléments, et a une très belle gestion des graphes. 

L'application MyDomoAtHome fait l'interface entre Imperihome et Domoticz. C'est un serveur appelé passerelle(gateway en anglais) qui transforme et expose les fonctionalités domoticz au client Imperihome.

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

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M3 atteint - tous les graphiques, gestion dynamique des pièces et améliorations de présentation
- [X] Support major type of sensors/feature of Domoticz
  - [X] Devices following planID
  - [X] Graphs
  - [X] Groupement des interrupteurs avec leur énergie
  - [X] Gestion des devices protégés

M4 milestone fournira un support d'autres plates-formes dont Synology
- [ ] Synology
  - [ ] Synology hosted package
- [ ] Debian package - noarch
  - [ ] debian hosted package - need a peer
  - [ ] raspbian hosted package
- TODO
  - [ ] Evohome (depending on Imperihome)
  - [ ] Alarm pannel (partial with ImperiHome)
  - [X] End to end authentificaton
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
### config.json

  Cela fontionne en mode "clef":"valeur". Les valeurs par défaut sont:

    {
      "app_name": "MyDomoAtHome",
      "auth": null,
       "domoticz": {
        "ssl": false,
        "host": "127.0.0.1",
        "port": "8080",
        "path": "/",
        "auth": null
      },
      "port": "3002",
      "passcode": ""
    }

  - multi-instances: champs app_name différent entre les instances
  - changer le port de MDAH: changer le port basic (haut niveau)  (ici 3002)
  - code des protected devices: changer the passcode ci-dessus
  - acceder à domoticz en mode ssl: changer domoticz:port et mettre ssl à true
  - changer host ou port de domoticz: changer domoticz:host et domoticz.port
  - ajouter un login/pass pour accéder à MDAH: changer le champs "auth": null de haut niveau vers

    "auth": {
        "username": "admin",
        "password": "admin"
    },

  - gérer les login/pass de domoticz, faire de même pour domoticz:path

  
### Si vous restez sur une version pre 0.1.x et ne pouvez pas mettre à jour

    apt-get remove mydomoathome
    apt-get update
    apt-get install MyDomoAtHome
  
### Migration de la version M1 à la nouvelle version (celle-ci)

Arrêt du service

    sudo service MyDomoAtHome.sh stop
    rm /etc/init.d/MyDomoAtHome.sh
  
N.B. les deux peuvent cohabiter, il faut changer la valeur du paramètre app_name dans config.json et le port d'écoute. Vous devrez ensuite recréer une configuration dans Imperihome.

### Migration depuis ISS-Domo

  editez /etc/mydomoathome/config.json avec la valeur du port (8000 par default), et changer le paramètre app_name vers "ISS-Domo"
  arrêtez le service ISS-Domo et démarrez le service MyDomoAtHome

## Gérer le service manuellement

Le port par défaut est 3002.

### Démarrer le service:

    sudo service mydomoathome start

### Arrêter le service :

    sudo service mydomoathome stop

### Redémarrer le service :

    sudo service mydomoathome reload

## Docker (seulement pour ceux qui ont un gros synology, Xpenologies...)
L'image Docker est automatiquement crée sur la dernière version.
La configuration peut être passée par la ligne de commande (voir en dessous) ou dans un fichier de configuration car  /etc/mydomoathome est aussi monté dans l'image.

### Duplication de l'image

    docker pull epierre/iss-mdah
    
### Lancement du processus
N'oubliez pas de changer l'IP et d'autoriser dans Domoticz la plage d'adresse de Docker

    docker run --name=mdah --env DOMO="http://your_ip:8080" --env TZ=Europe/Paris -p 3002:3002 epierre/mdah

### Vérification des processus docker actifs

    docker ps
    
### Arrêt d'un processus docker

    docker stop mdah 
  
# Test de l'installation

  - Vérification dans un navigateur que le process fonctionne:
    http://gateway_ip:gateway_port/
  
  - Depuis cette page, vous pourrez tester les autres URL dans un navigateur sinon vérifiez les logs dans /var/log/mydomoathome/

  - Vérification que le process est accessible depuis la machine faisant tourner Domoticz:

    curl http://domoticz_ip:domoticz_port/json.htm?type=devices&filter=all&used=true&order=Name
    

  - Vérification que MyDomoAtHome récupère bien les informations depuis Domoticz:

    curl http://gateway_ip:gateway_port/devices
    
  
# Support: 
  - Fonctinalités et Bug report: https://github.com/empierre/MyDomoAtHome/issues
  - English : http://www.domoticz.com/forum/viewtopic.php?f=21&t=6882
  - Français  : http://easydomoticz.com/forum/viewtopic.php?f=12&t=573
  - Si vous avez un device manquant, envoyez votre domoticz.db à: domoticz at e-nef.com

# Q&A
  - Pensez à rajouter l'IP de la gateway MyDomoAtHome (si elle est différente) dans la section réseaux locaux de Domoticz !

[npm-image]: https://img.shields.io/npm/v/node-mydomoathome.svg?style=flat
[npm-url]: https://npmjs.org/package/node-mydomoathome
[travis-image]: https://travis-ci.org/empierre/MyDomoAtHome.svg
[travis-url]: https://travis-ci.org/empierre/MyDomoAtHome
