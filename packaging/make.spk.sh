#!/bin/bash
cd packaging/synology/
tar cvzf package.tgz .
perl -pi -e "s/version=.*/version="${ver}"/" INFO
md5sum packages.tgz | perl -pi -e "s/checksum=.*/checksum="-"/" INFO
cd ..
tar cvf node-mydomoathome-$1.spk synology/
dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$1.spk
mv -f ./packaging/node-mydomoathome-$1.spk ../binary/
