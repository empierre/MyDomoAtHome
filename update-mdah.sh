#!/bin/sh
clear

if [ $EUID -ne 0 ]; then
        echo "You must run this script as root"
        echo "Example: sudo $0"
        exit
fi

sudo service MyDomoAtHome.sh stop
sleep 2
git pull
sudo apt-get install libaudio-mpd-perl libnet-upnp-perl libpoe-component-client-mpd-perl  whiptail
sudo service MyDomoAtHome.sh start
