# MyDomoAtHome nodeJS
REST Gateway between Domoticz and Imperihome ISS

[![NPM Version][npm-image]][npm-url]
![NPM](https://img.shields.io/npm/dm/node-mydomoathome.svg)
![REST](https://travis-ci.org/empierre/MyDomoAtHome.svg?branch=nodejs)
[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")

![MP](https://img.shields.io/badge/Platform-Independant-green.svg)
![REST](https://img.shields.io/badge/REST_API-powered-green.svg)
![REST](https://img.shields.io/badge/RPI-tested_ok-green.svg)
![REST](https://img.shields.io/badge/Odroid-tested_ok-green.svg)
![REST](https://img.shields.io/badge/Intel-tested_ok-green.svg)

![MyDomoAtHome](http://domoticz.com/wiki/images/5/55/Imperihome.png "MyDomoAtHome")

# Features and goals
The initial goal is to provide a REST API to ImperiHome ISS that would only allow to see the current state of sensors and interact with them in case of an actuator. 

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M1 Goal reached
M2 milestone will provide extended support to other platforms with Docker and Synology 
- [X] Free
- [X] Multi-platform (Linux, Mac OS X, Windows)
- [X] Dependency-less 
- [X] Node.js rewrite
- [X] Micro-services (Docker)
- [-] Synology
- - [X] Synology docker image
  - [ ] Synology hosted package
- [-] Debian package- noarch
  - [X] personal hosting
  - [ ] debian hosted package - need a peer
  - [ ] raspbian hosted package
- [-] Support major type of sensors/feature of Domoticz
  - [X] Weather and Environmental sensors  
  - [X] Energy sensors (Electricity, Gas, Water)
  - [X] Switches
  - [X] Thermostat
  - [ ] Graphs
  - [X] Dynamic room creation
- TODO
  - [X] RGB lamps (Limitless/Applamp/Hue) (depending on Domoticz)
  - [ ] Evohome (depending on Imperihome)
  - [X] Push On buttons (depending on Imperihome)
  - [ ] Alarm pannel (partial with ImperiHome)
  - [ ] End to end authentificaton
  - [ ] Auto updatable through apt-get
  - [ ] Auto updatable through button
  - [X] Installation / usage logs

[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")



# Standalone installation (PI, cubie, odroid, intel...)

## Install procedure

### Check the nodeJS version installed - mandatory for PI !

   sudo node —version // should print version 3.x or above

If not please do:

On RASPBIAN (Raspberry PI/PI2), please install first to have a stable nodeJS :

    wget -q http://www.e-nef.com/domoticz/mdah/nodejs_4.4.2_armhf.deb
    wget -q http://www.e-nef.com/domoticz/mdah/npm_2.14.7_armhf.deb
    sudo dpkg -i nodejs_4.4.2_armhf.deb
    sudo dpkg -i npm_2.14.7_armhf.deb

On all other (debian, ubuntu...), version 4 is required (testing/unstable are fine):

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs
  
  The following commands install npm and then upgrade it to the latest 2.x version.
  
    sudo apt-get install npm
    sudo npm install -g npm@2.x
  
  Note: npm version 3 is the latest version, but is currently not recommended for use.

And check again 

    node —version // should print version 4.4.x or similar
    npm —version // should print version 2.2.x or similar

### Installing the software Debian package .deb

    wget -qO - http://www.e-nef.com/domoticz/mdah/gpg.key | sudo apt-key add -
    sudo vi /etc/apt/sources.list
   
  Add the line:
  
    deb http://www.e-nef.com/domoticz/mdah/ /

  Then:

    sudo apt-get update
    sudo apt-get install mydomoathome  
    sudo apt-get upgrade

  edit /etc/mydomoathome/config.json with your values
  
     sudo service MyDomoAtHome.sh restart
  
### Migrating from old/Legacy MyDomoAtHome

Shut down the old service
    sudo service MyDomoAtHome.sh stop
    rm /etc/init.d/MyDomoAtHome.sh
  
N.B. you can have the both at the same time, just chane the App name in the config.json file and the port.

## Running the service

The default port is now 3002.

### Start the service:

    sudo service mydomoathome start

### Stop the service :

    sudo service mydomoathome stop

### Restart the service :

    sudo service mydomoathome reload

## Docker installation (only for those using this form: big synologyes, Xpenologies...)

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
  - Check the domoticz is accessible from the hosting machine:

    curl http://domoticz_ip:domoticz_port/json.htm?type=devices&filter=all&used=true&order=Name

  - Check the MDAH returns the result from the hosting machine:

    curl http://gateway_ip:gateway_port/devices
  
# Support: 
  - Tracking: https://github.com/empierre/MyDomoAtHome/issues
  - English : http://www.domoticz.com/forum/viewtopic.php?f=5&t=2713
  - French  : http://easydomoticz.com/forum/viewtopic.php?f=12&t=573
  - Send domoticz.db for an undetected device: domoticz at e-nef.com

# Q&A
  - Remember to add the gateway in the local networks under setup in domoticz !

[npm-image]: https://img.shields.io/npm/v/node-mydomoathome.svg?style=flat
[npm-url]: https://npmjs.org/package/node-mydomoathome
[travis-image]: https://travis-ci.org/empierre/MyDomoAtHome.svg
[travis-url]: https://travis-ci.org/empierre/MyDomoAtHome
