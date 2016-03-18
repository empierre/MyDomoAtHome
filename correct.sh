#!/bin/sh -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
git commit -a
ver=$1
cd ./packaging/mdah/ && sudo bash ./redeb.sh
cd ../..
mv -f ./packaging/mdah/node-mydomoathome-1.deb ./binary/
cp -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-latest.deb
cp -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-$1.deb
sitecopy -u mdah
