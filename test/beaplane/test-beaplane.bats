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

    waitforpass $LOGFILE \
		"obus-server: OK: listening on PORT=60001" \
		20 true
    
#    failtest "<-forced for debug"
}

@test "test-beaplane-run" {
    ts

    run_beaplane
    waitforpass $LOGFILE \
		"manager listening" \
		20 true
    
#    failtest "<-forced for debug"
}

@test "test-beaplane-kill" {
    ts

    kill_beaplane
    
    waitforpass $LOGFILE \
		"@test-beaplane-kill: KILL_BEAPLANE(): finish." \
		20 true
}

