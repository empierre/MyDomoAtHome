#!/bin/sh
clear
echo "Stoping MyDomoAtHome service..."
sudo service MyDomoAtHome.sh stop
echo "Retrieving latest code..."
git pull
echo "Checking latest libraries dependencies..."
sudo apt-get -y install libaudio-mpd-perl libnet-upnp-perl libpoe-component-client-mpd-perl  whiptail cpanminus
sudo apt-get -y install libtime-piece-perl libjson-perl libplack-perl starman libcrypt-ssleay-perl libdatetime-perl libdancer2-perl libswitch-perl  2>&1 
sudo cpanm dancer2
echo "Restarting MyDomoAtHome service..."
sudo service MyDomoAtHome.sh start
echo "Update path finished"
