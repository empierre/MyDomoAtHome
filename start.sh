#!/bin/sh
nohup plackup -E production -s Starman --workers=2 -p 5001 -a bin/app.pl &
