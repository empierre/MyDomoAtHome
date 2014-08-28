#!/bin/sh
 
# Start a Plack daemon.
 
PATH=/bin:/usr/bin:/sbin:/usr/sbin:
DAEMON="/usr/bin/plackup"
NAME="MyDomoAtHome"
CWD=`pwd`
# Defaults
RUN="no"
OPTIONS="-E production -s Starman --workers=4 -p 5001 -a /home/in/test/testenv/MyDomoAtHome/bin/app.pl" # CHANGE TO YOUR PATH HERE
 
PIDFILE="$NAME.pid"
 
#
# These compatibility funcs are here just for sarge backports.
# They will be removed post-etch.
#
log_daemon_msg() {
echo -n "$1: $2"
}
 
log_end_msg() {
if [ $1 -ne 0 ]; then
echo " failed!"
else
echo "."
fi
}
 
[ -f /lib/lsb/init-functions ] && . /lib/lsb/init-functions
 
start()
{
log_daemon_msg "Starting plack server" "$NAME"
start-stop-daemon -b -m --start --quiet --pidfile "$PIDFILE" --exec $DAEMON -- $OPTIONS
if [ $? != 0 ]; then
log_end_msg 1
exit 1
else
log_end_msg 0
fi
}
 
signal()
{
 
if [ "$1" = "stop" ]; then
SIGNAL="TERM"
log_daemon_msg "Stopping plack server" "$NAME"
else
if [ "$1" = "reload" ]; then
SIGNAL="HUP"
log_daemon_msg "Reloading plack server" "$NAME"
else
echo "ERR: wrong parameter given to signal()"
exit 1
fi
fi
if [ -f "$PIDFILE" ]; then
start-stop-daemon --stop --signal $SIGNAL --quiet --pidfile "$PIDFILE"
if [ $? = 0 ]; then
log_end_msg 0
else
SIGNAL="KILL"
start-stop-daemon --stop --signal $SIGNAL --quiet --pidfile "$PIDFILE"
if [ $? != 0 ]; then
log_end_msg 1
[ $2 != 0 ] || exit 0
else
rm "$PIDFILE"
log_end_msg 0
fi
fi
if [ "$SIGNAL" = "KILL" ]; then
rm -f "$PIDFILE"
fi
else
log_end_msg 0
fi
}
 
case "$1" in
start)
start
;;
 
force-start)
start
;;
 
stop)
signal stop 0
;;
 
force-stop)
signal stop 0
;;
 
reload)
signal reload 0
;;
 
force-reload|restart)
signal stop 1
sleep 2
start
;;
 
*)
echo "Usage: /etc/init.d/$NAME {start|force-start|stop|force-stop|reload|restart|force-reload}"
exit 1
;;
esac
 
exit 0
