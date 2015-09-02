#!/bin/sh

sudo service MyDomoAtHome.sh stop
sleep 10
git pull
sleep 10
sudo service MyDomoAtHome.sh start
