#!/bin/bash
fatpack trace --use=Plack::Runner /usr/bin/plackup
fatpack packlists-for `cat fatpacker.trace` > packlists
fatpack tree `cat packlists`
(fatpack file; cat /usr/bin/plackup) > plackup-fat.pl  
tar cvzf app2.tgz *
cp app2.tgz /media/usb1
