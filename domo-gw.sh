#! /bin/bash
#
# domogw.sh	init script for domoticz REST gateway
#
#		Modified for Debian GNU/Linux

### BEGIN INIT INFO
# Provides:          domo-gw
# Required-Start:    $network $remote_fs $syslog
# Required-Stop:     $network $remote_fs $syslog
# Should-Start:
# Should-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Home Automation System Gateway
# Description:       This daemon will start the Domoticz Gateway
### END INIT INFO

set -e

PATH=/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/bin

# Source function library.
. /etc/init.d/functions

# Get config.
test -f /etc/sysconfig/network && . /etc/sysconfig/network

# Check that we are root ... so non-root users stop here
[ `id -u` = 0 ] || exit 1

# Check that networking is up.
[ "${NETWORKING}" = "yes" ] || exit 0

RETVAL=0

STARMAN="/usr/bin/starman"
MYAPP_HOME="/home/cubie/Domo"
PID_FILE="/var/run/MyDomoAtHome-http.pid"
PORT=5001
HOST=127.0.0.1
STARMAN_OPTS="-D -E deploy --pid $PID_FILE -I$MYAPP_HOME/lib --listen $HOST:$PORT $MYAPP_HOME/bin/app.pl"

test -f STARMAN || exit 0

start(){
    echo -n $"Starting myapp-http: "

    daemon --pidfile $PID_FILE $STARMAN "$STARMAN_OPTS"
    RETVAL=$?
    echo
    touch /var/lock/subsys/myapp-http
    return $RETVAL
}

stop(){
    echo -n $"Stopping $prog: "
    killproc -p $PID_FILE $prog  
    RETVAL=$?
    echo
    rm -f /var/lock/subsys/myapp-http
    return $RETVAL

}

restart(){
    stop
    start
}

condrestart(){
    [ -e /var/lock/subsys/myapp-http ] && restart
    return 0
}


# See how we were called.
case "$1" in
    start)
 start
 ;;
    stop)
 stop
 ;;
    status)
 status -p $PID_FILE starman
 ;;
    restart)
 restart
 ;;
    condrestart)
 condrestart
 ;;
    *)
 echo $"Usage: $0 {start|stop|status|restart|condrestart|reload}"
 RETVAL=1
esac

exit $RETVAL
