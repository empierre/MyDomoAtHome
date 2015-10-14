#!/bin/sh
# if your application is not installed in @INC path:
export PERL5LIB='~/domoticz/MyDomoAtHome/lib/'
#export PLACK_ENV='development'
exec 2>&1 \
 sudo -u www-data plackup -E development -s Starman --workers=2 -p 5001  -a bin/app2.pl
