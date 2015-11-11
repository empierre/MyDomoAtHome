# MyDomoAtHome
DOMO/REST Gateway between Domoticz and Imperihome ISS

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status](https://coveralls.io/repos/empierre/MyDomoAtHome/badge.svg?branch=master&service=github)](https://coveralls.io/github/empierre/MyDomoAtHome?branch=master)

![MP](https://img.shields.io/badge/Platform-Independant-green.svg)
![REST](https://img.shields.io/badge/REST API-powered-green.svg)
[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")
![REST](https://img.shields.io/badge/RPI-tested ok-green.svg)
![REST](https://img.shields.io/badge/Odroid-tested ok-green.svg)
![REST](https://img.shields.io/badge/Intel-tested ok-green.svg)

![MyDomoAtHome](http://domoticz.com/wiki/images/5/55/Imperihome.png "MyDomoAtHome")

# Features and goals
The initial goal is to provide a REST API to ImperiHome ISS that would only allow to see the current state of sensors and interact with them in case of an actuator. 

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M1 Goal reached
M2 milestone will provide extended support to other platforms with Docker and Synology 
- [x] Free
- [x] Multi-platform (Linux, Mac OS X, Windows)
- [x] Micro-services (Docker)
- [ ] Synology package
- [ ] Support major type of sensors/feature of Domoticz
  - [ ] Weather and Environmental sensors  
  - [ ] Energy sensors (Electricity, Gas, Water)
  - [ ] Switches
  - [ ] Thermostat
- [x] Dependency-less 
- [ ] Node.js rewrite
- [ ] Auto updatable
- [ ] Support every single type of sensors/feature of Domoticz
  - [ ] Dynamic room creation
- Optionnal
  - [ ] RGB lamps (depending on Domoticz)
  - [ ] Push On buttons (depending on Imperihome)
  - [ ] Alarm pannel

[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=&item_name=thanks "Donate once-off to this project using Paypal")




# Standalone installation (PI, cubie, odroid, intel...)

## Install procedure
  - `cd ~/domoticz/`
  - `git clone https://github.com/empierre/MyDomoAtHome MyDomoAtHome`
  - `cd MyDomoAtHome`
  - `cp config.json.def config.json`
  - edit config.json with your values
  - edit  MyDomoAtHome.sh and change the path line 16 to your home installation
  - `sh ./run_once.sh`
  
## Running the service

The default port is now 3001.

### Start the service:
   `sudo service MyDomoAtHome.sh start`

### Stop the service :
   `sudo service MyDomoAtHome.sh stop`

### Restart the service :
   `sudo service MyDomoAtHome.sh reload`

### Update:
  - `cd ~/domoticz/MyDomoAtHome`
  - `sh ./update-mdah.sh`

## Docker installation

### Duplicate the image
    docker pull epierre/mydomoathome
    
### Launch the process
Remember to change the IP below and authorize in Domoticz the docker IP range
    docker run --name=mydomoathome --env domo_path="http://ip:8080" -it --rm -p 3001:3001 epierre/mydomoathome

### Check running docker processes
    docker ps
    
### Stoping a docker process
    docker stop DOCKER_ID (found from the docler ps)
  
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

[npm-image]: https://img.shields.io/npm/v/MyDomoAtHome.svg?style=flat
[npm-url]: https://npmjs.org/package/mydomoathome
[travis-image]: https://travis-ci.org/empierre/MyDomoAtHome.svg
[travis-url]: https://travis-ci.org/empierre/MyDomoAtHome

