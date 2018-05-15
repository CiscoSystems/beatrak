#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

# Management server type. Valid values are "ads", "xds", "rest"
XDS=${XDS:-xds}

# Envoy start-up command
ENVOY=${ENVOY:-/usr/local/bin/envoy}

BEAPLANE_DEBUG_FLAG=-debug
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
    echo "test-integration.sh: -> FAIL"
    cleanup
    exit 1
}

passtests() {
    echo "test-integration.sh: -> PASS"
    cleanup
    exit 0
}


## TODO: test this more 
trap cleanup EXIT

##
## TEST: obus-server-60001-start
##
testname=test-"obus-server-60001-start"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname"-out.log"
rm -f $log /tmp/$testname*.log
touch $log
(DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000  -l /tmp/$testname-log.log -o $log -e /tmp/$testname-error.log ../obus/obus-server.js &> $log)&
OBUS_SERVER_60001_PID=$!

waitfor isthere $log  "obus-server: OK: started" 50 false

if [[ "$isthere" == true ]]; then
    echo "test-integration.sh: "$testname": -> PASS"
else
    echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: beaplane-start
##
testname=test-"beaplane-start"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname"-out.log"
rm -f $log
touch $log
(./beaplane ${BEAPLANE_DEBUG_FLAG} "$@" &> $log)&
BEAPLANE_PID=$!

waitfor isthere $log  "manager listening" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: envoy-start-v1
##
testname=test-"envoy-start-v1"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old envoy"
kill_envoy
log="/tmp/"$testname".log"
rm -f $log
touch $log
ENVOY_CONFIG=envoy-beaplane-static-eds-obus-node-01-v1.yaml
(${ENVOY} -c ./test/envoy-configs/${ENVOY_CONFIG} --drain-time-s 1 --v2-config-only &> $log)&
ENVOY_PID=$!

waitfor isthere $log  "starting workers" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi


##
## TEST: beaplane-bucket-v1
##
testname=test-"beaplane-bucket-v1"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname".log"
bucket=test/buckets/bucket-eds-60001-obus-node-01-v1.yaml
rm -f $log
touch $log
(curl -XPOST -sS "localhost:60011/bucket" --data-binary @$bucket -H "Content-type: text/x-yaml" &>$log)&
CURL_PID=$!

waitfor isthere $log  "beaplane: OK: loaded bucket" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

## 
##  TEST: obus-client-v1
##
testname=test-"obus-client-v1"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old client"
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log
touch $log
(HOST=localhost PORT=55001 LABEL=obus-client-test-integration DEBUG=obus:* node ../obus/obus.js > $log)&
OBUS_CLIENT_PID=$!

waitfor isthere $log  "obus-server-60001" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: envoy-start-v2
##
testname=test-"envoy-start-v2"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old envoy"
kill_envoy
log="/tmp/"$testname".log"
rm -f $log
touch $log
ENVOY_CONFIG=envoy-beaplane-eds-rds-obus-node-01-v2.yaml
(${ENVOY} -c ./test/envoy-configs/${ENVOY_CONFIG} --drain-time-s 1 --v2-config-only &> $log)&
ENVOY_PID=$!

waitfor isthere $log  "starting workers" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: beaplane-bucket-v2
##
testname=test-"beaplane-bucket-v2"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname".log"
bucket=test/buckets/bucket-eds-rds-60001-obus-node-01-v2.yaml
rm -f $log
touch $log
(curl -XPOST -sS "localhost:60011/bucket" --data-binary @$bucket -H "Content-type: text/x-yaml" &>$log)&
CURL_PID=$!

waitfor isthere $log  "beaplane: OK: loaded bucket" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

## 
##  TEST: obus-client-v2
##
testname=test-"obus-client-v2"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old client"
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log
touch $log
(HOST=localhost PORT=55001 LABEL=obus-client-test-integration DEBUG=obus:* node ../obus/obus.js > $log)&
OBUS_CLIENT_PID=$!

waitfor isthere $log  "obus-server-60001" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: obus-server-60002-start
##
testname=test-"obus-server-60002-start"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname"-out.log"
rm -f $log /tmp/$testname*.log
touch $log
(DEBUG=obus-server:* PORT=60002 ID=60002 forever start --minUptime=1000 --spinSleepTime=1000  -l /tmp/$testname-log.log -o $log -e /tmp/$testname-error.log ../obus/obus-server.js &> $log)&
OBUS_SERVER_60002_PID=$!

waitfor isthere $log  "obus-server: OK: started" 50 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

##
## TEST: envoy-start-v3
##
testname=test-"envoy-start-v3"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old envoy"
kill_envoy
log="/tmp/"$testname".log"
rm -f $log
touch $log
ENVOY_CONFIG=envoy-beaplane-eds-rds-obus-node-01-v3.yaml
(${ENVOY} -c ./test/envoy-configs/${ENVOY_CONFIG} --drain-time-s 1 --v2-config-only &> $log)&
ENVOY_PID=$!

waitfor isthere $log  "starting workers" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

## TODO: * if can't find the bucket: [~/src/github.com/cdmitri/beatrak/src/beaplane]$ cat /tmp/test-beaplane-bucket-v3.log
##         "ERROR: beaplane: unknown err = <nil>"
##
## TEST: beaplane-bucket-v3
##
testname=test-"beaplane-bucket-v3"
echo "test-integration.sh: "$testname": ..."
log="/tmp/"$testname".log"
bucket=test/buckets/bucket-eds-rds-60001-60002-obus-node-01-v3.yaml
rm -f $log
touch $log
(curl -XPOST -sS "localhost:60011/bucket" --data-binary @$bucket -H "Content-type: text/x-yaml" &>$log)&
CURL_PID=$!
waitfor isthere $log  "beaplane: OK: loaded bucket" 100 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

## 
##  TEST: obus-client-60001-v3
##
testname=test-"obus-client-60001-v3"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old client"
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log
touch $log
(HOST=localhost PORT=55001 LABEL=obus-client-test-integration-60001 DEBUG=obus:* node ../obus/obus.js > $log)&
OBUS_CLIENT_PID=$!

waitfor isthere $log  "obus-server-60001" 500 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

## 
##  TEST: obus-client-60002-v3
##
testname=test-"obus-client-60002-v3"
echo "test-integration.sh: "$testname": ..."
echo "test-integration.sh: "$testname": kill old client"
kill_obus_client
log="/tmp/"$testname".log"
rm -f $log
touch $log
(HOST=localhost PORT=55001 LABEL=obus-client-test-integration-60002 DEBUG=obus:* node ../obus/obus.js > $log)&
OBUS_CLIENT_PID=$!

waitfor isthere $log  "obus-server-60002" 500 false

if [[ "$isthere" == true ]]; then
   echo "test-integration.sh: "$testname": -> PASS"
else
   echo "test-integration.sh: "$testname": -> FAIL, LOG="$log
   failtests
fi

passtests
