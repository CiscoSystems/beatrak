#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

##
## MODULE: beacon
##
modulename="obus: test-beacon.sh"

##
## SETUP
##

SRC_DIR=$PWD
DO_CLEANUP="${DO_CLEANUP:-true}"

export LOCPICK_HTTP_HOST="localhost"
export LOCPICK_HTTP_PORT=58080
export LOCPICK_GRPC_HOST="localhost"
export LOCPICK_GRPC_PORT=58085
export LOCPICK_GRPC_TLS_PORT=58090

export BEACON_HTTP_HOST="localhost"
export BEACON_HTTP_PORT=8080
export BEACON_GRPC_HOST="localhost"
export BEACON_GRPC_PORT=8085

export LOCPICK_TLS_CA_CERT=$SRC_DIR"/../keys/beatrak-ca-cert.pem"
export LOCPICK_TLS_CLIENT_KEY=$SRC_DIR"/../keys/beatrak-client1-key.pem"
export LOCPICK_TLS_CLIENT_CERT=$SRC_DIR"/../keys/beatrak-client1-cert.pem"

export ZONE="zb"

# still to use
export BEACON_TLS_CA_CERT=$SRC_DIR"/../keys/beatrak-ca-cert.pem"
export BEACON_TLS_SERVER_KEY=$SRC_DIR"/../keys/beatrak-server-key.pem"
export BEACON_TLS_SERVER_CERT=$SRC_DIR"/../keys/beatrak-server-cert.pem"
export BEACON_TLS_CLIENT_KEY=$SRC_DIR"/../keys/beatrak-client1-key.pem"
export BEACON_TLS_CLIENT_CERT=$SRC_DIR"/../keys/beatrak-client1-cert.pem"
export OBUS_TLS_CA_CERT=$SRC_DIR"/../keys/beatrak-ca-cert.pem"
export OBUS_TLS_CLIENT_KEY=$SRC_DIR"/../keys/beatrak-client1-key.pem"
export OBUS_TLS_CLIENT_CERT=$SRC_DIR"/../keys/beatrak-client1-cert.pem"

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
		echo "waitfor["$lnum"] "$line
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
	if [[ "${OBUS_CLIENT_PID}" == "NOKILL" ]]; then
	    return
	fi
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

kill_locpick() {
    if [[ -n "${LOCPICK_PID+x}" ]]; then
	if [[ "${LOCPICK_PID}" == "NOKILL" ]]; then
	    return
	fi
	kill ${LOCPICK_PID}
    fi
}

kill_beacon() {
    if [[ -n "${BEACON_PID+x}" ]]; then
	if [[ "${BEACON_PID}" == "NOKILL" ]]; then
	    return
	fi
	kill ${BEACON_PID}
    fi
}

cleanup() {
    if [[ "$DO_CLEANUP" == true ]]; then
	# echo "cleanup: start"
	forever stopall > /dev/null

	kill_obus_client
	kill_beaplane
	kill_envoy
	kill_locpick
	kill_beacon

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
## TEST: beacon-start
##
testname=test-"beacon-start"
echo $modulename": "$testname": ..."
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
cd ../beacon/beacon-msvc/app
(LOG_LEVEL=TRACE node beacon.js --grpc --tls &> $log)&
BEACON_PID=$!

cd - >/dev/null

waitfor isthere $log  "OK: locpick http info" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {locpick http info}: -> PASS"
else
    echo $modulename": "$testname": {locpick http info}: -> FAIL, LOG="$log
    failtests
fi


waitfor isthere $log  "OK: locpick grpc info" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {locpick grpc info}: -> PASS"
else
    echo $modulename": "$testname": {locpick grpc info}: -> FAIL, LOG="$log
   failtests
fi

waitfor isthere $log  "OK: locpick grpc tls info" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {locpick grpc tls info}: -> PASS"
else
    echo $modulename": "$testname": {locpick grpc tls info}: -> FAIL, LOG="$log
   failtests
fi


waitfor isthere $log  "OK: beacon HTTP server" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {beacon server http}: -> PASS"
else
    echo $modulename": "$testname": {beacon server http}: -> FAIL, LOG="$log
   failtests
fi

waitfor isthere $log  "OK: beacon GRPC server" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {beacon server grpc}: -> PASS"
else
    echo $modulename": "$testname": {beacon server grpc}: -> FAIL, LOG="$log
   failtests
fi


waitfor isthere $log  "OK: locpick location" 200 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {beacon location grpc tls}: -> PASS"
else
    echo $modulename": "$testname": {beacon location grpc tls}: -> FAIL, LOG="$log
   failtests
fi

waitfor isthere $log  "OK: init done" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {beacon init}: -> PASS"
else
    echo $modulename": "$testname": {beacon init}: -> FAIL, LOG="$log
   failtests
fi

##
## TEST: beacon-http-info
##
testname=test-"beacon-http-info"
echo $modulename": "$testname": ..."
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(curl -sS http://$BEACON_HTTP_HOST:$BEACON_HTTP_PORT > $log)&
CURL_PID=$!
#echo "CURL_PID="$CURL_PID

waitfor isthere $log  "{\"Name\":\"beacon\",\"SID\":\"beacon" 5 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: beacon-grpc-info
##
testname=test-"beacon-grpc-info"
echo $modulename": "$testname": ..."
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(HOST=$BEACON_GRPC_HOST PORT=$BEACON_GRPC_PORT LABEL=beacon-grpc-info DEBUG=obus:* node ./obus.js --beacon --info > $log)&
OBUS_CLIENT_PID="NOKILL"
#echo "OBUS_CLIENT_PID_2="$OBUS_CLIENT_PID

waitfor isthere $log  "beaconInfo(): OK" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

passtests

##
##
## FINISH
## 
##
