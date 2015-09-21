#!/bin/sh
clear
echo "Stoping MyDomoAtHome service..."
sudo service MyDomoAtHome.sh stop
echo "Retrieving latest code..."
git pull
echo "Checking latest libraries dependencies..."
sudo apt-get -y install libaudio-mpd-perl libnet-upnp-perl libpoe-component-client-mpd-perl  whiptail
echo "Restarting MyDomoAtHome service..."
sudo service MyDomoAtHome.sh start
echo "Update path finished"
