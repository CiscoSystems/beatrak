#!/usr/bin/env bats

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

@test "test-locpick-run-v0.1" {
    ts
    # get the startup log from the outer log /tmp/test-api.sh.log
    waitforpass /tmp/test-api.sh.log "main(): locpick server on http://127.0.0.1:8080" 100 true
}

@test "test-locpick-info-v0.1" {
    ts
    #    failtest
    #    (curl -sS http://127.0.0.1:8080 &>> $LOGFILE)&
    log "curl result="$(curl -sS http://127.0.0.1:8080)
    waitforpass $LOGFILE  "locpickid" 100 true
}
