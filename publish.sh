#!/bin/sh -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
git commit -a
git push
npm version $1
ver=$1
perl -pi -e "s/Version: .*/Version: ${ver}/g" packaging/mdah/deb-src/DEBIAN/control
cd ./packaging/mdah/ && sudo bash ./redeb.sh
cd ../..
mv ./packaging/mdah/node-mydomoathome-1.deb ./binary/
cp ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-latest.deb
cp ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-$1.deb
sitecopy -u mdah
npm publish 
./make.docker.sh
