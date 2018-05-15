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

# WAITFOR[92] 2018-05-15T00:45:56+00:00 info: locpick.js: initServers(): OK: locpick HTTP server on http://localhost:8080
# WAITFOR[93] Method handler loc for /locpick.Locpick/Loc expected but not provided
# WAITFOR[94] 2018-05-15T00:45:56+00:00 info: locpick.js: initServers(): OK: locpick GRPC server on http://localhost:8085
# WAITFOR[95] 2018-05-15T00:45:56+00:00 info: locpick.js: initServers(): OK: locpick GRPC TLS server on http://localhost:8090

@test "test-locpick-run" {
    ts
    # get the startup log from the outer log /tmp/test-api.sh.log
    match="OK: locpick HTTP server on http://localhost:8080"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 92 true

    match="OK: locpick GRPC server on http://localhost:8085"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 94 true

    match="OK: locpick GRPC TLS server on http://localhost:8090"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 95 true
}

# info about locpick
@test "test-locpick-get-info-v0.1" {
    skip
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"{\"name\":\"locpick\",\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"type\":\"list\",\"zone\":\"nozone\"}" \
	5 true
}

# list of locations generated so far
@test "test-locpick-get-locs-v0.1" {
    skip
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080/locs)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"count\":0,\"locs\":[]}" \
	5 true
}

# generate new location without (with default) zone
@test "test-locpick-get-loc-nozone-v0.1" {
    skip
    ts
    out=$(curl -XPUT -sS http://127.0.0.1:8080/locs)
    log "curl out=$out"
    waitforpass \
	$LOGFILE \
	"\{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"noloc\",\"zone\":\"nozone\"}}" \
	100 true
    
}

# generate new location in ZA and ZB zones
@test "test-locpick-get-loc-zone-v0.1" {
    skip
    ts
    out=$(curl -XPUT -sS http://127.0.0.1:8080/za/locs)
    log "curl 1st za out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"brussels\",\"lonlat\":\"50.8386789,4.2931938\",\"zone\":\"za\"}}" \
	5 true

    out=$(curl -XPUT -sS http://127.0.0.1:8080/za/locs)
    log "curl 2nd za out =$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"paris\",\"lonlat\":\"48.8588376,2.2768487\",\"zone\":\"za\"}}" \
	7 true

    out=$(curl -XPUT -sS http://127.0.0.1:8080/zb/locs)
    log "curl 1st zb out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"sj\",\"lonlat\":\"37.2969949,-121.887452\",\"zone\":\"zb\"}}" \
	9 true
}

# reset and generate new location in ZA and ZB again
@test "test-locpick-reset-v0.1" {
    skip
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080/reset)
    log "curl restet out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"name\":\"locpick\",\"type\":\"list\",\"zone\":\"nozone\"}" \
	5 true

    out=$(curl -XPUT -sS http://127.0.0.1:8080/za/locs)
    log "curl 1st za out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"brussels\",\"lonlat\":\"50.8386789,4.2931938\",\"zone\":\"za\"}}" \
	7 true

    out=$(curl -XPUT -sS http://127.0.0.1:8080/zb/locs)
    log "curl 1st zb out=$out"
    waitforpass \
	$LOGFILE \
	"{\"sid\":\"locpick_*\",\"locpickid\":\"locpick_*\",\"loc\":{\"name\":\"sj\",\"lonlat\":\"37.2969949,-121.887452\",\"zone\":\"zb\"}}" \
	9 true
}


# get config
@test "test-locpick-get-config-v0.1" {
    skip
    ts
    out=$(curl -XGET -sS http://127.0.0.1:8080/config)
    log "curl config out=$out"
    waitforpass \
	$LOGFILE \
	"brussels*paris*amsterdam*sj*sf*la" \
	5 true
}


