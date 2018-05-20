#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

DO_CLEANUP=true

##
## UTIL
##
# read line-by-line, limit to number of lines and
# limit match
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
		echo "lnum="$lnum
		echo "line="$line
	    fi
	    if [[ $lnum == $lmax ]]; then
		done=true
	        break
	    elif [[ $line = *$search* ]]; then
		echo "WAITFOR(): matched line="$line >> $log
		eval $retval=true
		done=true
		break
            fi
	    (( lnum++ ))
	done < $log
	sleep 0.5 # sleep a bit if we could not read anything
    done
}

kill_obus_client() {
    if [[ -n "${OBUS_CLIENT_PID+x}" ]]; then
	kill ${OBUS_CLIENT_PID}
    fi
}

kill_beaplane() {
    if [[ -n "${BEAPLANE_PID+x}" ]]; then
	kill ${BEAPLANE_PID}
    fi
}


kill_envoy() {
    if [[ -n "${ENVOY_PID+x}" ]]; then
	kill ${ENVOY_PID}
    fi
}

cleanup() {
    if [[ "$DO_CLEANUP" == true ]]; then
	# echo "cleanup: start"
	forever stopall > /dev/null

	kill_obus_client
	kill_beaplane
	kill_envoy

	DO_CLEANUP=false
    
	# echo "cleanup: finish"
    fi
}

failtests() {
    echo $modulename": -> FAIL"
    cleanup
    exit 1
}

passtests() {
    echo $modulename": -> PASS"
    cleanup
    exit 0
}

## TODO: test this more 
trap cleanup EXIT

##
## MODULE: obus
##

modulename="obus: test-integration.sh"

##
## TEST: obus-server-60001-start
##
testname=test-"obus-server-60001-start"
echo $modulename": "$testname": ..."
log="/tmp/"$testname"-out.log"
rm -f $log /tmp/$testname*.log
touch $log
(DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000  -l /tmp/$testname-log.log -o $log -e /tmp/$testname-error.log ./obus-server.js &> $log)&
OBUS_SERVER_60001_PID=$!

# TODO: put a better non-error finish message
waitfor isthere $log  "obus-server: OK: started" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: obus-server-60001-ping
##
testname=test-"obus-server-60001-ping"
echo $modulename": "$testname": ..."
echo $modulename": "$testname": kill old client"
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(HOST=localhost PORT=60001 LABEL=obus-server-ping-integration DEBUG=obus:* node ./obus.js --server > $log)&
OBUS_CLIENT_PID=$!

# TODO: put a better non-error finish message
waitfor isthere $log  "obus-server-60001" 50 true

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

passtests


