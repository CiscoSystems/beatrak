# helpers
# convetion: internal bats helpers log in all caps, as in ts(){log blah} -> TS(): blah
#
execute() {
	>&2 echo "++ $@"
	eval "$@"
}


declare -a LOCPICK_PIDS
run_locpick() {
    local locpick_pid_file="/tmp/locpick.pid"
    log "RUN_LOCPICK(): start..."
    log "RUN_LOCPICK(): LOGFILE="$LOGFILE
    if [ -e $locpick_pid_file ]; then
	log "RUN_LOCPICK(): $locpick_pid_file exists"
	return
    else
	log "RUN_LOCPICK(): $locpick_pid_file does not exist"
	SRC_DIR="../../src/locpick/locpick-msvc/app"
	cd $SRC_DIR
	(LOG_LEVEL=DEBUG node server.js &>> $LOGFILE)&
	LOCPICK_PID=$!
	echo $LOCPICK_PID &> $locpick_pid_file
	LOCPICK_PIDS[${#LOCPICK_PIDS}]=$LOCPICK_PID
	cd -
    fi
    log "RUN_LOCPICK(): finish."
}

# TODO: finish some of the beginning
#       of the work to be able to juggle
#       locpick and other PIDs with arrays
kill_locpick() {
    local locpick_pid_file="/tmp/locpick.pid"
    log "KILL_LOCPICK(): start..."
    log "KILL_LOCPICK(): LOCPICK_PIDS=${LOCPICK_PIDS[@]}"

    if [ -e $locpick_pid_file ]; then
	log "KILL_LOCPICK(): $locpick_pid_file exists"
	LOCPICK_PID=$(cat $locpick_pid_file)
	log "KILL_LOCPICK(): killing locpick_pid=$LOCPICK_PID..."
	kill $LOCPICK_PID || true
	log "KILL_LOCPICK(): waiting..."
	wait $LOCPICK_PID 2> /dev/null || true
	log "KILL_LOCPICK(): removing ${locpick_pid_file}..."
	rm -f $locpick_pid_file
    else
	log "RUN_LOCPICK(): $locpick_pid_file does not exist"
    fi
    log "KILL_LOCPICK(): finish."
}

waitforpass() {
    #waitfor isthere $1 "Cannot find module" 100 true
    waitfor isthere $1 "$2" $3 $4

    if [[ "$isthere" != true ]]; then
	failtest "<-waitfortest()"
    fi
}

waitfor() {
    local  retval=$1
    local  log=$2
    local  search=$3
    local  lmax=$4
    local  debug=$5

    eval $retval=false
    local lnum=1
    local done=false

    while [[ "$done" != true ]]; do
	while IFS='' read -r line || [[ -n "$line" ]]; do
	    if [[ "$debug" == true ]]; then
		echo "WAITFOR["$lnum"] "$line
	    fi
	    if [[ $lnum == $lmax ]]; then
		done=true
	        break
	    elif [[ $line = *$search* ]]; then
		echo "WAITFOR(): MATCHED LINE="$line >> $log
		eval $retval=true
		done=true
		break
            fi
	    (( lnum++ ))
	done < $log
	sleep 0.5 # sleep a bit if we could not read anything
    done
}


log_start() {
	 echo "--------------------------" $1 &> $LOGFILE
	 echo "- @$BATS_TEST_DESCRIPTION" $1 &>> $LOGFILE
	 echo "--------------------------" $1 &>> $LOGFILE
}

log() {
	 echo "@$BATS_TEST_DESCRIPTION:" $1 &>> $LOGFILE
}

log_finish() {
	 echo "@$BATS_TEST_DESCRIPTION: FINISH" $1 &>> $LOGFILE
}

# fail the test so that LOGFILE is dumped
failtest() {
    sleep 0.1 # give a chance for forks to finish
    log "FAILTEST()"$1
    [ 0 -eq 1 ]
}
