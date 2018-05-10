# helpers
# convetion: internal bats helpers log in all caps, as in ts(){log blah} -> TS(): blah
#
execute() {
	>&2 echo "++ $@"
	eval "$@"
}

function launch_locpick() {
    local  retval=$1
    
    log="/tmp/test-launch-locpick.log"
    
    cd $SRC_DIR
    (LOG_LEVEL=DEBUG node server.js &>> $log)&
    LOCPICK_PID=$!
#    (echo "launch_locpick(): LOCPICK_PID="$LOCPICK_PID &>> $log)&
#    eval $retval=$LOCPICK_PID
    return 0 # explicit for consistency
}

kill_locpick() {
        log="/tmp/test-kill-locpick.log"
        echo "kill_locpick(): LOCPICK_PID="$LOCPICK_PID &>> $log

	kill $LOCPICK_PID
	wait $LOCPICK_PID 2>/dev/null
	return 0 # explicit, otherwise returns wait() status
}

function waitforpass() {
    #waitfor isthere $1 "Cannot find module" 100 true
    waitfor isthere $1 "$2" $3 $4

    if [[ "$isthere" != true ]]; then
	failtest
    fi
}

function waitfor() {
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
		echo "waitfor["$lnum"] "$line
	    fi
	    if [[ $lnum == $lmax ]]; then
		done=true
	        break
	    elif [[ $line = *$search* ]]; then
		echo "helpers.bash: waitfor(): MATCHED LINE="$line >> $log
		eval $retval=true
		done=true
		break
            fi
	    (( lnum++ ))
	done < $log
	sleep 0.5 # sleep a bit if we could not read anything
    done
}


function log_start() {
	 echo "--------------------------" $1 &> $LOGFILE
	 echo "- @$BATS_TEST_DESCRIPTION" $1 &>> $LOGFILE
	 echo "--------------------------" $1 &>> $LOGFILE
}

function log() {
	 echo "@$BATS_TEST_DESCRIPTION:" $1 &>> $LOGFILE
}

function log_finish() {
	 echo "@$BATS_TEST_DESCRIPTION: FINISH" $1 &>> $LOGFILE
}

# fail the test so that LOGFILE is dumped
function failtest() {
    sleep 0.1 # give a chance for forks to finish
    log "FAILTEST()"
    [ 0 -eq 1 ]
}
