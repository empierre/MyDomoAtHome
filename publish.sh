#!/bin/sh -x 
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
fi
#git tag -a "v$1" -m "Release of version $1"
ver=$1
#Docker automatic build
perl -pi -e "s/^RUN wget.*/RUN wget http:\/\/www.e-nef.com\/domoticz\/mdah\/node-mydomoathome-${ver}.deb/" Dockerfile
perl -pi -e "s/RUN dpkg -i node-mydomoathome.*/RUN dpkg -i node-mydomoathome-${ver}.deb/" Dockerfile
#Github update
git commit -a
#npm version $1
npm run release $1
./git-release.sh $1
git push origin --tags
git push
#Go to packaging
cd packaging 
#Synology package
./make.spk.sh $1
#Debian package
./make.deb.sh $1
cd ..
#Publish Packages
cd binary
dpkg-sig -k A5435C9B --sign builder node-mydomoathome-$1.deb
dpkg-sig -k A5435C9B --sign builder node-mydomoathome-latest.deb
rm -f Packages Packages.gz Packages.bz2 Release InRelease Release.gpg
apt-ftparchive packages . > Packages
gzip -c Packages > Packages.gz
bzip2 -c Packages > Packages.bz2
apt-ftparchive release . >Release
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release
./make.buster.sh
./make.oldstable.sh
sitecopy -u mdah
cd ..
#NPM repository
npm publish 
curl -X POST --data-urlencode 'payload={"channel": "#general", "username": "webhookbot", "text": "New package version '"$1"' available at <http://www.e-nef.com/domoticz/mdah/node-mydomoathome-latest.deb|node-mydomoathome-'"$1"'.deb>", "icon_emoji": ":ghost:"}' https://hooks.slack.com/services/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
#./make.docker.sh
