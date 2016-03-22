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
mv -f ./packaging/mdah/node-mydomoathome-1.deb ./binary/
cp -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-latest.deb
cp -f ./binary/node-mydomoathome-1.deb ./binary/node-mydomoathome-$1.deb
sitecopy -u mdah
npm publish 
curl -X POST --data-urlencode 'payload={"channel": "#general", "username": "webhookbot", "text": "New package version $1 available at <http://www.e-nef.com/domoticz/mdah/node-mydomoathome-latest.deb|node-mydomoathome-latest.deb>", "icon_emoji": ":ghost:"}' https://hooks.slack.com/services/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
./make.docker.sh
