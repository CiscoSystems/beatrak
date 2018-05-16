run_obus_server_60001() {
   (DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000  -l $LOGFILE -o $LOGFILE -e $LOGFILE ../obus/obus-server.js &> $LOGFILE)&
    OBUS_SERVER_60001_PID=$!
}
