#!/usr/bin/env bats

load ../helpers/helpers

SUIT_LOGFILE="/tmp/suit-api-locpick.log"
#rm -rf $SUIT_LOGFILE
#touch $SUIT_LOGFILE

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
    #    run "date" "-Iseconds"
    run "date" "-Ins"
    log "TS(): "$output
}

SRC_DIR="../../src/locpick/locpick-msvc/app"

@test "test-locpick-run-v0.1" {
    ts
}

@test "test-locpick-info-v0.1" {
    skip
    ts
    failtest
}
