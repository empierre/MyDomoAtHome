#!/bin/sh
### BEGIN INIT INFO  
# Provides:          ImperiHomestart  
# Required-Start:    $all  
# Required-Stop:     $all  
# Default-Start:     2 3 4 5  
# Default-Stop:      0 1 6  
# Short-Description: Start imperihome  
# Description:       Imperihome.  
### END INIT INFO
nohup plackup -E production -s Starman --workers=2 -p 5001 -a bin/app.pl &
