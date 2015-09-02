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
  - edit  MyDomoAtHome.sh and change the path line 20 to your home installation
  - sh ./run_once.sh
  
To run the service:
-------------------

To start the service:
   sudo service MyDomoAtHome.sh start

To stop the service :
   sudo service MyDomoAtHome.sh stop

To restart the service :
   sudo service MyDomoAtHome.sh reload

To update:
----------

  - cd ~/domoticz/MyDomoAtHome
  - sh ./update-mdah.sh
  
To setup:
---------

  - Setup: http://domoticz.com/wiki/ImperiHome
  - Remember to add the gateway in the local networks under setup in domoticz !
  - Support: http://www.domoticz.com/forum/viewtopic.php?f=5&t=2713
  - to send domoticz.db for an undetected device: domoticz at e-nef.com

