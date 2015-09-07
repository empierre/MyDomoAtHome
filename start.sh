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
echo "please use the automatic start script to be installed with run_once.sh"
nohup plackup -E production -s Starman --workers=2 -p 3001 -a bin/app.pl --pid /tmp/mydomoathome.pid &
