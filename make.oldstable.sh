#!/bin/sh
cd binary/dists/oldstable
rm -f Packages Packages.gz
apt-ftparchive packages . > Packages
gzip -c Packages > Packages.gz
rm -rf InRelease Release.gpg
apt-ftparchive -o APT::FTPArchive::Release::Origin="mdah" -o APT::FTPArchive::Release::Label="Debian" -o APT::FTPArchive::Release::Suite="oldstable" -o APT::FTPArchive::Release::Architectures="amd64 arm64 armel armhf i386 mips mips64el mipsel ppc64el s390x" release . > Release
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release
cd ../../..
