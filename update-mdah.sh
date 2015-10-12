#!/bin/sh
################################################################################
#      This file is part of MyDomoAtHome - https://github.com/empierre/MyDomoAtHome
#      Copyright (C) 2014-2015 Emmanuel PIERRE (domoticz@e-nef.com)
#
#  MyDomoAtHome is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 2 of the License, or
#  (at your option) any later version.
#
#  MyDomoAtHome is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with MyDomoAtHome.  If not, see <http://www.gnu.org/licenses/>.
################################################################################
clear
echo "Stoping MyDomoAtHome service..."
sudo service MyDomoAtHome.sh stop
echo "Retrieving latest code..."
git pull
echo "Setting directories rights..."
 sudo chown www-data.www-data logs
 sudo chown www-data.www-data logs/*
echo "Checking latest libraries dependencies..."
sudo apt-get -y install libaudio-mpd-perl libnet-upnp-perl libpoe-component-client-mpd-perl  whiptail cpanminus
sudo apt-get -y install libtime-piece-perl libjson-perl libplack-perl starman libcrypt-ssleay-perl libdatetime-perl libswitch-perl  2>&1 
./speedUP.sh
sudo cpanm Time::Moment
#curl -L http://cpanmin.us | perl - --sudo Dancer2
echo "Restarting MyDomoAtHome service..."
sudo service MyDomoAtHome.sh start
echo "Update path finished"
