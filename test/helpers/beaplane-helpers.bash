kill_obus_server_60001() {
    # need to do this twice
    (forever stopall &>>$LOGFILE)&
    (forever stopall &>>$LOGFILE)&
    forever cleanlogs
}


run_obus_server_60001() {

    log "run_obus_server_60001(): LOGFILE=$LOGFILE"

    (DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000 --append -l /tmp/test-obus-server-60001-run.log -o /dev/null -e /dev/null ../../src/obus/obus-server.js &>> $LOGFILE)&

}
