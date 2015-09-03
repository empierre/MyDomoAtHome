#!/bin/sh

sudo service MyDomoAtHome.sh stop
sleep 5
git pull
sleep 5
sudo service MyDomoAtHome.sh start
