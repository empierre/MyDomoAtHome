#!/bin/sh
sudo apt-get update
sudo apt-get install libdancer-perl libfile-slurp-perl  liblwp-protocol-psgi-perl 
sudo apt-get install libtime-piece-perl libjson-perl libplack-perl starman  libcrypt-ssleay-perl libdatetime-perl
sudo apt-get install libdbd-sqlite3-perl libdbi-perl sqlite3
sudo cp MyDomoAtHome.sh /etc/init.d/MyDomoAtHome.sh
sudo chmod +x /etc/init.d/MyDomoAtHome.sh
sudo update-rc.d MyDomoAtHome.sh defaults


