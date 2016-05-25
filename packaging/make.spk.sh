#!/bin/bash -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
    exit
fi
ver=$1
cd synology/
cp ../../../MyDomoAtHome/mdah.js app/
cp ../../../MyDomoAtHome/package.json app/
cp ../../../MyDomoAtHome/README.md app/
rsync -a ../../../MyDomoAtHome/public/ public/ --delete
rsync -a ../../../MyDomoAtHome/routes/ routes/ --delete
rsync -a ../../../MyDomoAtHome/views/ views/ --delete
rsync -a ../../../MyDomoAtHome/bin/ bin/ --delete
tar cvzf package.tgz app/ public/ routes/ bin/ views/ var/ --format=pax
mv -f ./package.tgz ./build/
cd build
perl -pi -e "s/version=.*/version=\"${ver}\"/" INFO
md5=($(md5sum package.tgz))
perl -pi -e "s/checksum=.*/checksum=\"${md5}\"/" INFO
tar cvf ../node-mydomoathome-$ver.spk scripts/* INFO LICENSE PACKAGE_ICON_120.PNG  PACKAGE_ICON.PNG  package.tgz  --format=pax
#dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$ver.spk
cd ..
mv -f ./node-mydomoathome-$ver.spk ../../binary/
