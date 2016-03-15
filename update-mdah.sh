#!/bin/sh
clear
echo "Stoping MyDomoAtHome service..."
sudo service mydomoathome stop
echo "Retrieving latest code..."
cd /tmp/
rm /tmp/node-mydomoathome-latest.deb
wget http://www.e-nef.com/domoticz/mdah/node-mydomoathome-latest.deb
sudo dpkg -i node-mydomoathome-latest.deb
echo "Restarting MyDomoAtHome service..."
sudo service mydomoathome start
echo "Update path finished"
