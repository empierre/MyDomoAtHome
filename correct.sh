#!/bin/sh -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
git commit -a
ver=$1
cd ./packaging/debian/ && sudo bash ./redeb.sh
cd ../..
mv -f ./packaging/debian/node-mydomoathome-1.deb ./binary/
cp -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-latest.deb
mv -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-$1.deb
cd binary
dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$1.deb
dpkg-sig -k A5435C9B --sign builder node-mydomoathome-latest.deb
rm -f Packages Packages.gz Release InRelease Release.gpg
apt-ftparchive packages . > Packages
gzip -c Packages > Packages.gz
apt-ftparchive release . >Release
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release
./make.buster.sh
./make.oldstable.sh
sitecopy -ukk mdah
