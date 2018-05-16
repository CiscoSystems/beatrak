declare -a BEAPLANE_PIDS

kill_obus_server_60001() {
    # need to do this twice
    (forever stopall &>>$LOGFILE)&
    (forever stopall &>>$LOGFILE)&
    forever cleanlogs
}

run_obus_server_60001() {
    (DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000 --append -l /tmp/test-obus-server-60001-run.log -o /dev/null -e /dev/null ../../src/obus/obus-server.js &>> $LOGFILE)&
}

run_beaplane() {
    local pid_file="/tmp/beaplane.pid"
    log "RUN_BEAPLANE(): start..."
    log "RUN_BEAPLANE(): LOGFILE="$LOGFILE

    if [ -e $pid_file ]; then
	log "RUN_BEAPLANE(): $pid_file exists"
	return
    else
	log "RUN_BEAPLANE(): $pid_file does not exist"
	(${SRC_DIR}/beaplane/beaplane -debug &> $LOGFILE)&
	local pid=$!
	echo $pid &> $pid_file
	BEAPLANE_PIDS[${#BEAPLANE_PIDS}]=$BEAPLANE_PID
    fi
    log "RUN_BEAPLANE(): finish."
}

kill_beaplane() {
    local pid_file="/tmp/beaplane.pid"
    log "KILL_BEAPLANE(): start..."
    log "KILL_BEAPLANE(): BEAPLANE_PIDS=${BEAPLANE_PIDS[@]}"

    if [ -e $pid_file ]; then
	log "KILL_BEAPLANE(): $pid_file exists"
	pid=$(cat $pid_file)
	log "KILL_BEAPLANE(): killing locpick pid=$pid..."
	kill $pid || true
	log "KILL_BEAPLANE(): waiting..."
	wait $pid 2> /dev/null || true
	log "KILL_BEAPLANE(): removing ${pid_file}..."
	rm -f $pid_file
    else
	log "KILL_BEAPLANE(): $pid_file does not exist"
    fi
    log "KILL_BEAPLANE(): finish."
}

