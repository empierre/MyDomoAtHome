#!/bin/bash

# IMPORTANT 
# Protect agaisnt mispelling a var and rm -rf /
set -u
set -e

SRC=/tmp/mydomoathome-deb-src
DIST=/tmp/mydomoathome-deb-dist
SYSROOT=${SRC}/sysroot
DEBIAN=${SRC}/DEBIAN

rm -rf ${DIST}
mkdir -p ${DIST}/

rm -rf ${SRC}
rsync -a deb-src/ ${SRC}/

#rsync -a ../../MyDomoAtHome/ ${SYSROOT}/opt/MyDomoAtHome/ --delete
cp ../../../MyDomoAtHome/mdah.js ${SYSROOT}/usr/share/mydomoathome/app/
cp ../../../MyDomoAtHome/package.json ${SYSROOT}/usr/share/mydomoathome/app/
#cp ../../../MyDomoAtHome/npm-shrinkwrap.json ${SYSROOT}/usr/share/mydomoathome/app/
cp ../../../MyDomoAtHome/README.md ${SYSROOT}/usr/share/mydomoathome/app/
rsync -a ../../../MyDomoAtHome/public/ ${SYSROOT}/usr/share/mydomoathome/public/ --delete

find ${SRC}/ -type d -exec chmod 0755 {} \;
find ${SRC}/ -type f -exec chmod go-w {} \;
chown -R root:root ${SRC}/

let SIZE=`du -s ${SYSROOT} | sed s'/\s\+.*//'`+8
pushd ${SYSROOT}/
tar czf ${DIST}/data.tar.gz [a-z]*
popd
sed s"/SIZE/${SIZE}/" -i ${DEBIAN}/control
pushd ${DEBIAN}
tar czf ${DIST}/control.tar.gz *
popd

pushd ${DIST}/
echo 2.0 > ./debian-binary

find ${DIST}/ -type d -exec chmod 0755 {} \;
find ${DIST}/ -type f -exec chmod go-w {} \;
chown -R root:root ${DIST}/
ar r ${DIST}/node-mydomoathome-1.deb debian-binary control.tar.gz data.tar.gz
popd
rsync -a ${DIST}/node-mydomoathome-1.deb ./
