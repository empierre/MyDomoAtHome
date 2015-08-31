DOMO/ REST Gateway between Domoticz and Imperihome
==================================================

(french speaking installation and support forum: http://easydomoticz.com/forum/viewtopic.php?f=12&t=573 )

To install:
-----------
  
  - cd ~/domoticz/
  - git clone https://github.com/empierre/MyDomoAtHome MyDomoAtHome
  - cd MyDomoAtHome
  - cp config.yml.def config.yml
  - cp production.yml.def production.yml
  - cp development.yml.def development.yml
  - edit config.yml, production.yml, development.yml

To update:
----------

  - cd ~/domoticz/MyDomoAtHome
  - git pull
  
To setup:
---------

  - Setup: http://domoticz.com/wiki/ImperiHome
  - Remember to add the gateway in the local networks under setup in domoticz !
  - Support: http://www.domoticz.com/forum/viewtopic.php?f=5&t=2713
  - to send domoticz.db for an undeteced device: domoticz at e-nef.com

