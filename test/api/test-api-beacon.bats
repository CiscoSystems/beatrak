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

# startup sequence and status
# TODO: keep adding tests, currently during refactoring
@test "test-beacon-locpick-run-fail-v0.1" {
    ts
    # get the startup log from the outer log /tmp/test-api.sh.log
    match="Error: listen EADDRINUSE 127.0.0.1:8080"
    log "matching match=$match"
    waitforpass /tmp/test-api.sh.log $match 100 true
}
