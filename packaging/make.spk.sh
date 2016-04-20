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
rsync -a ../../../MyDomoAtHome/views/ views/ --delete
rsync -a ../../../MyDomoAtHome/bin/ bin/ --delete
tar cvzf package.tgz app/ public/ routes/ bin/ views/
mv -f ./package.tgz ./build/
cd build
perl -pi -e "s/version=.*/version=\"${ver}\"/" INFO
md5=($(md5sum package.tgz))
perl -pi -e "s/checksum=.*/checksum=\"${md5}\"/" INFO
cd ..
tar cvf node-mydomoathome-$ver.spk -C build  .
#dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$ver.spk
mv -f ./node-mydomoathome-$ver.spk ../../binary/
