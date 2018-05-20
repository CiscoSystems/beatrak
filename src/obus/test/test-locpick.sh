#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

##
## MODULE: locpick
##
modulename="obus: test-locpick.sh"

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

export LOCPICK_TLS_CA_CERT=$SRC_DIR"/../keys/beatrak-ca-cert.pem"
export LOCPICK_TLS_SERVER_KEY=$SRC_DIR"/../keys/beatrak-server-key.pem"
export LOCPICK_TLS_SERVER_CERT=$SRC_DIR"/../keys/beatrak-server-cert.pem"
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
	if [[ "${LOCPICK_PID}" == "NOKILL" ]]; then
	    return
	fi
	kill ${LOCPICK_PID}
}

cleanup() {
    if [[ "$DO_CLEANUP" == true ]]; then
	# echo "cleanup: start"
	forever stopall > /dev/null

	kill_obus_client
	kill_beaplane
	kill_envoy
	kill_locpick

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
## TEST: locpick-start
##
testname=test-"locpick-start"
echo $modulename": "$testname": ..."
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
cd ../locpick/locpick-msvc/app
#(node locpick.js &> $log)&
#(yarn start &> $log)&
#(node locpick.js &> $log)&
(LOG_LEVEL=DEBUG node locpick.js &> $log)&
LOCPICK_PID=$!
#echo "LOCPICK_PID="$LOCPICK_PID

cd -

waitfor isthere $log  "OK: locpick HTTP server" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {server http}: -> PASS"
else
    echo $modulename": "$testname": {server http}: -> FAIL, LOG="$log
   failtests
fi

waitfor isthere $log  "OK: locpick GRPC server" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {server grpc}: -> PASS"
else
    echo $modulename": "$testname": {server grpc}: -> FAIL, LOG="$log
   failtests
fi

waitfor isthere $log  "OK: locpick GRPC TLS server" 100 false
if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": {server grpc tls}: -> PASS"
else
    echo $modulename": "$testname": {server grpc tls}: -> FAIL, LOG="$log
   failtests
fi

##
## TEST: locpick-http-info
##
testname=test-"locpick-http-info"
echo $modulename": "$testname": ..."
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(curl -sS http://$LOCPICK_HTTP_HOST:$LOCPICK_HTTP_PORT > $log)&
CURL_PID=$!
#echo "CURL_PID="$CURL_PID

waitfor isthere $log  "{\"Name\":\"locpick\",\"SID\":\"locpick" 5 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: locpick-grpc-ping
##
testname=test-"locpick-grpc-ping"
echo $modulename": "$testname": ..."
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(HOST=$LOCPICK_GRPC_HOST PORT=$LOCPICK_GRPC_PORT LABEL=locpick-ping-integration DEBUG=obus:* node ./obus.js --locpick --ping > $log)&
OBUS_CLIENT_PID=$!
#echo "OBUS_CLIENT_PID_1="$OBUS_CLIENT_PID

waitfor isthere $log  "locpickPing(): OK" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: locpick-grpc-info
##
testname=test-"locpick-grpc-info"
echo $modulename": "$testname": ..."
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(HOST=$LOCPICK_HTTP_HOST PORT=$LOCPICK_GRPC_PORT LABEL=locpick-grpc-info DEBUG=obus:* node ./obus.js --locpick --info > $log)&
OBUS_CLIENT_PID="NOKILL"
#echo "OBUS_CLIENT_PID_2="$OBUS_CLIENT_PID

waitfor isthere $log  "locpickInfo(): OK" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: locpick-grpc-tls-info
##
testname=test-"locpick-grpc-tls-info"
echo $modulename": "$testname": ..."
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log /tmp/$testname*.log
touch $log
(HOST=$LOCPICK_GRPC_HOST PORT=$LOCPICK_GRPC_TLS_PORT LABEL=locpick-grpc-tls-info DEBUG=obus:* node ./obus.js --locpick --info --tls > $log)&
OBUS_CLIENT_PID="NOKILL"
#echo "OBUS_CLIENT_PID_2="$OBUS_CLIENT_PID

waitfor isthere $log  "locpickInfo(): OK" 100 false

if [[ "$isthere" == true ]]; then
    echo $modulename": "$testname": -> PASS"
else
    echo $modulename": "$testname": -> FAIL, LOG="$log
   failtests
fi


passtests
