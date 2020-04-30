#!/bin/sh
cd binary/dists/buster/contrib/binary-all
rm -f Packages Packages.gz
apt-ftparchive packages . > Packages
gzip -c Packages > Packages.gz
cd ../..
rm -rf InRelease Release.gpg
apt-ftparchive -o APT::FTPArchive::Release::Origin="mdah" -o APT::FTPArchive::Release::Label="Debian" -o APT::FTPArchive::Release::Suite="stable" -o APT::FTPArchive::Release::Version="10.3" -o APT::FTPArchive::Release::Codename="buster" -o APT::FTPArchive::Release::Architectures="amd64 arm64 armel armhf i386 mips mips64el mipsel ppc64el s390x" -o APT::FTPArchive::Release::Components="contrib" release . > Release
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release
cd ../../..
