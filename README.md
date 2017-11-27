# MyDomoAtHome nodeJS
REST Gateway between Domoticz and Imperihome ISS

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
Documentation en Français: https://github.com/empierre/MyDomoAtHome/blob/nodejs/README_FR.md
![MyDomoAtHome](http://domoticz.com/wiki/images/f/f1/Imperihome2.png "MyDomoAtHome ISS")

# Important update
Our repository has moved to https, so if you have an update message, please do the following:

    sudo nano /etc/apt/sources.list

Add modify to https the line to have this :

    deb https://www.e-nef.com/domoticz/mdah/ /

# Features and goals
The goal of this project is to provide a REST API to ImperiHome ISS that would allow to see the current state of sensors and interact with them in case of an actuator. 

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M1 Goal reached - first version in Perl Dancer after ISS has been announced

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M2 Goal reached - full rewrite to node js with debian packaging, simpler install and upgrade, better performance, less dependencies
- [X] Free but you can show you like it ! [![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")

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

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M3 Goal reached - full graphs, flexible room usage and UI improvements
- [X] Support major type of sensors/feature of Domoticz
  - [X] Devices following planID
  - [X] Graphs
  - [X] Groupe switches with instant energy
  - [X] Security code managed

M4 milestone will provide extended support to other platforms with Docker and Synology 
- [X] End to end authentificaton
- [X] HTTPS support
- [X] Support domoticz Farenheit
- [X] Synology
  - [X] Synology hosted package
- [X] Debian package - noarch
  - [ ] debian hosted package - need a peer
  - [ ] raspbian hosted package
- TODO
  - [ ] Evohome (depending on Imperihome)
  - [ ] Alarm pannel (partial with ImperiHome)
  - [ ] Auto updatable through button

[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")

# Standalone installation (PI, cubie, odroid, intel...)
[![NPM](https://nodei.co/npm/node-mydomoathome.png?downloads=true&downloadRank=true)](https://nodei.co/npm/node-mydomoathome/)


## Install procedure

### Check the nodeJS version installed - mandatory for PI !

    sudo dpkg --list |grep nodejs // should return version 4.x or above

If not please do:

On RASPBIAN (Raspberry PI/PI2/PI3), please install first to have a stable nodeJS :

    sudo apt-get remove node
    wget -q http://www.e-nef.com/domoticz/mdah/nodejs_4.4.2_armhf.deb
    sudo dpkg -i nodejs_4.4.2_armhf.deb
    wget -q http://www.e-nef.com/domoticz/mdah/npm_2.14.7_armhf.deb
    sudo dpkg -i npm_2.14.7_armhf.deb
    sudo npm install -g npm@2.x

On all other (debian, ubuntu...), version 4 is required (testing/unstable are fine):

    sudo apt-get remove node
    sudo dpkg -r nodejs npm
    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs
  
   The following commands install npm and then upgrade it to the latest 2.x version.
  
    sudo npm install -g npm@2.x
  
  Note: npm version 3 is the latest version, but is currently not recommended for use.

And check again 

    node —version // should print version 4.4.x or similar
    npm —version // should print version 2.2.x or similar

### Installing the software Debian package .deb

    wget -qO - http://www.e-nef.com/domoticz/mdah/gpg.key | sudo apt-key add -
    sudo nano /etc/apt/sources.list
   
  Add the line:
  
    deb https://www.e-nef.com/domoticz/mdah/ /

  Then:

    sudo apt-get update
    sudo apt-get install MyDomoAtHome 

  Important remark: do not install as root, but sudo as an unprivilegied user.

  Edit the configuration file with your values:
  
     sudo nano /etc/mydomoathome/config.json
  
     sudo service mydomoathome restart

### Installing the software on Synology

  Add http://www.jadahl.com/domoticz_beta_6/ to your Synology NAS Package Center sources !

  The package is node-mydomoathome

  Domoticz will run on port 8084 and MDAH on 3002. 

  Remember to set in Domoticz Settings/Local Networks 127.0.0.1

### Installing the software on Windows

  download and install nodejs here: https://nodejs.org/en/download/current/
  
  download zip here: https://github.com/empierre/MyDomoAtHome (green clone or download button right)
  
  unzip locally
  
  click window touch+R, type in 'cmd' and enter
  
  go in the unzipped repository
  
    npm install
    node mdah.js

  to launch do from a cmd window:

    node mdah.js 
    
  configuration "config.json" must be in the same directory as the file mdah.js

### config.json

  It works in a "key":"value" mode. Basic values are:

    {
      "app_name": "MyDomoAtHome",
      "auth": null,
      "tempmode": "C",
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

  - multi-instances: just change the app_name tag between instances
  - change the MDAH port: change the basic (top level) port (here 3002)
  - protected device code: change the passcode above
  - access domoticz in ssl mode: change domoticz:port and ssl to true
  - change domoticz host or port: do it on domoticz:host and domoticz.port
  - add a login/pass to access MDAH:change top-level "auth": null to 

    "auth": {
        "username": "admin",
        "password": "admin"
    },

  - manage login/pass on domoticz, do the same in domoticz:path

  - start in https mode:
	
~~~~
      openssl genrsa 1024 > key.pem
      openssl req -x509 -new -key key.pem > key-cert.pem
	
~~~~
      {
        "app_name": "MyDomoAtHome",
        "auth": null,
        "tempmode": "C",
        "https" : true,
        "key" : "test/fixtures/keys/key.pem",
        "cert": "test/fixtures/keys/key-cert.pem",
        "domoticz": {
          "ssl": false,
          "host": "127.0.0.1",
          "port": 8080,
          "path": "/"
        },
       "port": 3002,
       "passcode": ""
      }
  
### Stuck on a pre 0.1.x version

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

## Docker installation (only for those using this form: big Synologies, Xpenologies...)
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

  - Check in a browser it is running

    http://gateway_ip:gateway_port/
  
  - From there you'll get the following links in the browser.

  - Check the domoticz is accessible from the hosting machine

		curl http://domoticz_ip:domoticz_port/json.htm?type=devices&filter=all&used=true&order=Name

  - Check the MDAH returns the result from the hosting machine

		curl http://gateway_ip:gateway_port/devices

# Accessing the Gateway from the outide of your network
The best way is to setup the nginx for both domoticz and the gateway: http://www.domoticz.com/wiki/Secure_Remote_Access

  sudo apt-get install nginx-full
  sudo apt-get install openssl
  sudo apt-get install haveged


In the domoticz configuration add a section to redirect to the gateway such as this (change your ip below)

    location /iss/ {
      proxy_set_header X-Real-IP  $remote_addr;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header Host $host;
      proxy_pass http://192.168.0.28:3002/;
      access_log /var/log/nginx/mdah.access.log;
      error_log /var/log/nginx/mdah.error.log;
    }

# Advanced support

  For an unsupported device or any issue with a particular device, please report with it the JSON from Domoticz with this URL:

		http://domoticz_ip:8080/json.htm?type=devices&filter=all&used=true&order=Name

# Support
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
