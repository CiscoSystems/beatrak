#!/usr/bin/env bats

# TODO: trap ctrl-c and cleanup

load ../helpers/helpers

setup() {
    LOGFILE="/tmp/$BATS_TEST_DESCRIPTION.log"
    log_start
}

teardown() {
    echo "TEARDOWN(): LOGFILE="$LOGFILE
    echo "TEARDOWN(): $LOGFILE =>"
    cat $LOGFILE
    
    echo "TEARDOWN(): finish."
    
    log_finish
}

ts() {
    run "date" "-Ins"
    log "TS(): "$output
}

# startup sequence and status
@test "test-locpick-run-v0.1" {
    ts
    # get the startup log from the outer log /tmp/test-api.sh.log
    match="main(): locpick server on http://127.0.0.1:8080"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log $match 100 true
}

# info about locpick
@test "test-locpick-info-v0.1" {
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"{\"name\":\"locpick\",\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"type\":\"list\",\"zone\":\"nozone\"}" \
	100 true
}

# list of locations generated so far
@test "test-locpick-locs-v0.1" {
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080/locs)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"count\":0,\"locs\":[]}" \
	100 true
}

# generate new location without (with default) zone
@test "test-locpick-get-loc-nozone-v0.1" {
    ts
    out=$(curl -XPUT -sS http://127.0.0.1:8080/locs)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"\{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"noloc\",\"zone\":\"nozone\"}}" \
	100 true
    
}

# generate new location in ZA zone
@test "test-locpick-get-loc-za-v0.1" {
    ts
    out=$(curl -XPUT -sS http://127.0.0.1:8080/za/locs)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"brussels\",\"lonlat\":\"50.8386789,4.2931938\",\"zone\":\"za\"}}" \
	100 true
    # failtest "<-forced"
}




