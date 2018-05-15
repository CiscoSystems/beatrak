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

@test "test-beacon-locpick-run" {
    ts
    # get the startup log from the outer log /tmp/test-api.sh.log
    match="OK: locpick HTTP server on http://localhost:58080"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 92 true

    match="OK: locpick GRPC server on http://localhost:58085"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 94 true

    match="OK: locpick GRPC TLS server on http://localhost:58090"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log "$match" 95 true
}

@test "test-beacon-run" {
    ts
}

@test "test-beacon-locpick-http-info" {
    ts
    waitforpass /tmp/test-api.sh.log \
		"beacon.js: init(): OK: locpick http info" \
		200 true
}

@test "test-beacon-locpick-grpc-info" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: init(): OK: locpick grpc info" \
		200 true
}

@test "test-beacon-locpick-grpc-tls-info" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: init(): OK: locpick grpc tls info" \
		200 true
}

@test "test-beacon-http-server-init" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: initServers(): OK: beacon HTTP server on http://127.0.0.1:8080" \
		200 true
}


@test "test-beacon-grpc-init" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: initServers(): OK: beacon GRPC server on http://localhost:8085" \
		200 true
}

@test "test-beacon-get-loc" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"loc = {\"Name\":\"locpick\",\"SID\":\"locpick_*\",\"LocpickID\":\"locpick_*\",\"Type\":\"\",\"Zone\":\"\",\"LocName\":\"sj\",\"LocLonlat\":\"37.2969949,-121.887452\",\"LocZone\":\"zb\"}" \
		300 true

    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: init(): OK: locpick location" \
		300 true
}

@test "test-beacon-init-done" {
    ts
    waitforpass "/tmp/test-api.sh.log" \
		"beacon.js: main(): OK: init done" \
		300 true
}
