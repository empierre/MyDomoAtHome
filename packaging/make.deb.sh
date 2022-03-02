#!/bin/sh 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
    exit
fi
#git tag -a "v$1" -m "Release of version $1"
ver=$1
perl -pi -e "s/Version: .*/Version: ${ver}/" debian/deb-src/DEBIAN/control
cd debian && sudo bash ./redeb.sh
cd ..
sudo chown in.in debian/node-mydomoathome-1.deb
mv -f debian/node-mydomoathome-1.deb ../binary/
cp -f ../binary/node-mydomoathome-1.deb ../binary/node-mydomoathome-latest.deb
mv -f ../binary/node-mydomoathome-1.deb ../binary/node-mydomoathome-$1.deb
cp ../binary/node-mydomoathome-$1.deb ../binary/dists/stable/binary-all/
cp ../binary/node-mydomoathome-$1.deb ../binary/dists/oldstable/binary-all/
