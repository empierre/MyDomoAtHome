#!/bin/sh

sudo service MyDomoAtHome.sh stop
sleep 2
git pull
sudo apt-get install libaudio-mpd-perl libnet-upnp-perl libpoe-component-client-mpd-perl 
sudo service MyDomoAtHome.sh start
