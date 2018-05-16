. ${SRC_DIR}/../test/helpers/common-helpers.bash
. ${SRC_DIR}/../test/helpers/beaplane-helpers.bash

setup() {
    LOGFILE="/tmp/$BATS_TEST_DESCRIPTION.log"
    log_start
}

teardown() {
    echo "TEARDOWN(): $LOGFILE =>"
    cat $LOGFILE
    echo "TEARDOWN(): finish."
    log_finish
}

@test "test-obus-server-60001-run" {
    ts

    run_obus_server_60001
    
    waitforpass $LOGFILE \
		"Cannt" \
		10 true
    
    log "FOREVER1_PID=$FOREVER1_PID"

#    failtest "<-forced for debug"
}

