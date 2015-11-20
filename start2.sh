#!/bin/sh
# if your application is not installed in @INC path:
export PERL5LIB='/home/pi/domoticz/MyDomoAtHome/lib/'
exec 2>&1 \
 sudo -u www-data plackup -E development -s Starman --workers=2 -p 3001  -a /home/pi/domoticz/MyDomoAtHome/bin/app.pl
