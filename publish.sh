#!/bin/sh -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
git commit -a
git tag v$1
git push origin v$1
git push
npm version $1
ver=$1
perl -pi -e "s/Version: .*/Version: ${ver}/" packaging/mdah/deb-src/DEBIAN/control
perl -pi -e "s/RUN wget.*/RUN wget /http:\/\/www.e-nef.com\/domoticz\/mdah\/node-mydomoathome-${ver}.deb/" Dockerfile
perl -pi -e "s/RUN dpkg -i node-mydomoathome.*/RUN dpkg -i node-mydomoathome-${ver}.deb/" Dockerfile
cd ./packaging/mdah/ && sudo bash ./redeb.sh
cd ../..
mv -f ./packaging/mdah/node-mydomoathome-1.deb ./binary/
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
sitecopy -u mdah
cd ..
npm publish 
curl -X POST --data-urlencode 'payload={"channel": "#general", "username": "webhookbot", "text": "New package version '"$1"' available at <http://www.e-nef.com/domoticz/mdah/node-mydomoathome-latest.deb|node-mydomoathome-latest.deb>", "icon_emoji": ":ghost:"}' https://hooks.slack.com/services/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
./make.docker.sh
