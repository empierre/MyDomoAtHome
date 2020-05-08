#!/bin/sh
#cd binary/dists/buster/contrib/binary-all
rm -f  binary/dists/buster/contrib/binary-armhf/Packages  binary/dists/buster/contrib/binary-armhf/Packages.gz
#apt-ftparchive packages . > Packages
cd binary/
apt-ftparchive packages dists/buster/contrib/binary-armhf > dists/buster/contrib/binary-armhf/Packages
gzip -c  dists/buster/contrib/binary-armhf/Packages >  dists/buster/contrib/binary-armhf/Packages.gz
#cd ../../..
rm -rf InRelease Release
cd dists/buster
apt-ftparchive -o APT::FTPArchive::Release::Origin="mdah" -o APT::FTPArchive::Release::Label="Debian" -o APT::FTPArchive::Release::Suite="stable" -o APT::FTPArchive::Release::Version="10.3" -o APT::FTPArchive::Release::Codename="buster" -o APT::FTPArchive::Release::Architectures="amd64 arm64 armel armhf i386 mips mips64el mipsel ppc64el s390x" -o APT::FTPArchive::Release::Components="contrib" release . > Release
rm -fr InRelease; gpg --clearsign -o InRelease Release
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release
cd ../../..
