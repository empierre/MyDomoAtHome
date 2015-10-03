#!/bin/bash
fatpack trace --use=Dancer2 ../bin/app2.pl
fatpack packlists-for `cat fatpacker.trace` > packlists
fatpack tree `cat packlists`
(fatpack file; cat ../bin/app2.pl) > myapp2.pl  
tar cvzf app2.tgz *
cp app2.tgz /media/usb1
