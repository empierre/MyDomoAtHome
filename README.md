# MyDomoAtHome
DOMO/  REST Gateway between Domoticz and Imperihome ISS

![MyDomoAtHome](http://domoticz.com/wiki/images/5/55/Imperihome.png "MyDomoAtHome")

# Features and goals
- [x] Free
- [x] Multi-platform (Linux, Mac OS X, Windows)
- [ ] Support every single type of sensors/feature of Domoticz
  - [x] Weather and Environmental sensors  
  - [x] Energy sensors (Electricity, Gas, Water)
  - [ ] RGB lamps
  - [ ] Alarm pannel
- [x] Dependency-less 
- [x] Perl Dancer engine
- [ ] Auto updatable
- [x] MPD based players support (Volumio...)
- [ ] Kodi support
- [X] Provide Docker images
- [ ] Provide Synology package

The initial goal is to provide a REST API to ImperiHome ISS that would only allow to see the current state of sensors and interact with them in case of an actuator. 

![Reached](https://cdn3.iconfinder.com/data/icons/10con/512/checkmark_tick-16.png) M1 Goal reached

[![PayPal donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=epierre@e-nef.com&currency_code=EUR&amount=5&item_name=thanks "Donate once-off to this project using Paypal")

<form name="_xclick" action="https://www.paypal.com/fr/cgi-bin/webscr" method="post">
<input type="hidden" name="cmd" value="_xclick">
<input type="hidden" name="business" value="epierre@e-nef.com">
<input type="hidden" name="item_name" value="Thay a big thank to the developper">
<input type="hidden" name="currency_code" value="EUR">
<input type="hidden" name="amount" value="5,00">
<input type="image" src="http://www.paypal.com/fr_FR/i/btn/x-click-butcc-donate.gif" border="0" name="submit" alt="Effectuez vos paiements via PayPal : une solution rapide, gratuite et sécurisée">
</form>


## Docker container
docker pull epierre/mydomoathome

## Install procedure
  - `cd ~/domoticz/`
  - `git clone https://github.com/empierre/MyDomoAtHome MyDomoAtHome`
  - `cd MyDomoAtHome`
  - `cp config.yml.def config.yml`
  - `cp production.yml.def production.yml`
  - `cp development.yml.def development.yml`
  - edit config.yml, production.yml, development.yml
  - edit  MyDomoAtHome.sh and change the path line 20 to your home installation
  - `sh ./run_once.sh`
  
## Usage

### Start the service:
   `sudo service MyDomoAtHome.sh start`

### Stop the service :
   `sudo service MyDomoAtHome.sh stop`

### Restart the service :
   `sudo service MyDomoAtHome.sh reload`

### Update:
  - `cd ~/domoticz/MyDomoAtHome`
  - `sh ./update-mdah.sh`
  
## More detailed setup :
  - Setup: http://domoticz.com/wiki/ImperiHome
  - Remember to add the gateway in the local networks under setup in domoticz !
 
## Support: 
  - Tracking: https://github.com/empierre/MyDomoAtHome/issues
  - English : http://www.domoticz.com/forum/viewtopic.php?f=5&t=2713
  - French  : http://easydomoticz.com/forum/viewtopic.php?f=12&t=573
  - Send domoticz.db for an undetected device: domoticz at e-nef.com

