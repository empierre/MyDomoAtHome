#!/bin/sh
nohup plackup -E production -s Starman --workers=4 -p 5001 -a bin/app.pl &
