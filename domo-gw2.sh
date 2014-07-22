#! /bin/sh -e
#
# domo-gw.sh	init script for MyDomoAtHome

### BEGIN INIT INFO
# Provides:          MyDomoAtHome
# Required-Start:    $network $remote_fs $syslog
# Required-Stop:     $network $remote_fs $syslog
# Should-Start:
# Should-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Convert ISS Imperihome to Domoticz
# Description:       This daemon will start the MyDomoAtHome converter
### END INIT INFO

set -e

if [ -r "/lib/lsb/init-functions" ]; then
  . /lib/lsb/init-functions
else
  echo "E: /lib/lsb/init-functions not found, lsb-base (>= 3.0-6) needed"
  exit 1
fi

###MODIFY PATH BELOW ###
DAEMON="/home/cubie/domoticz/Domo/start.sh" #ligne de commande du programme
### DO NOT MODIFY ###
DEAMON_OPT=""
DAEMONUSER="www" #utilisateur du programme
DEAMON_NAME="start.sh" #Nom du programme (doit ?tre identique ? l'ex?cutable)
DEAMON_NAME_V="MyDomoAtHome" #Nom du programme a afficher

PATH="/sbin:/bin:/usr/sbin:/usr/bin"

test -x $DAEMON || exit 0

. /lib/lsb/init-functions

d_start () {
        log_daemon_msg "Starting system $DEAMON_NAME_V Daemon"
	start-stop-daemon --background --name $DEAMON_NAME --start --quiet --chuid $DAEMONUSER --exec $DAEMON -- $DEAMON_OPT
        log_end_msg $?
}

d_stop () {
        log_daemon_msg "Stopping system $DEAMON_NAME_V Daemon"
        start-stop-daemon --name $DEAMON_NAME --stop --retry 5 --quiet --name $DEAMON_NAME
	log_end_msg $?
}

case "$1" in

        start|stop)
                d_${1}
                ;;

        restart|reload|force-reload)
                        d_stop
                        d_start
                ;;

        force-stop)
               d_stop
                killall -q $DEAMON_NAME || true
                sleep 2
                killall -q -9 $DEAMON_NAME || true
                ;;

        status)
                status_of_proc "$DEAMON_NAME" "$DEAMON_NAME_V" "system-wide $DEAMON_NAME" && exit 0 || exit $?
                ;;
        *)
                echo "Usage: /etc/init.d/$DEAMON_NAME_V {start|stop|force-stop|restart|reload|force-reload|status}"
                exit 1
                ;;
esac
exit 0
