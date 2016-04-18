#!/bin/bash
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
ver=$1
cd synology/
cp ../../../MyDomoAtHome/mdah.js app/
cp ../../../MyDomoAtHome/package.json app/
cp ../../../MyDomoAtHome/README.md app/
rsync -a ../../../MyDomoAtHome/public/ public/ --delete
rsync -a ../../../MyDomoAtHome/routes/ routes/ --delete
cd .. &&tar cvzf package.tgz synology && cd synology && mv -f ../package.tgz .
perl -pi -e "s/version=.*/version=\"${ver}\"/" INFO
md5=($(md5sum package.tgz))
perl -pi -e "s/checksum=.*/checksum=\"${md5}\"/" INFO
cd ..
tar cvf node-mydomoathome-$ver.spk synology/
#dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$ver.spk
mv -f ./node-mydomoathome-$ver.spk ../binary/
