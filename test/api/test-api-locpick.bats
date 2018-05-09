#!/usr/bin/env bats

. ../helpers/helpers.bash

function teardown() {
	 echo "teardown(): start..."


# TODO: condition on verbose 
#	 echo "teardown(): BATS_TEST_FILENAME="$BATS_TEST_FILENAME
#	 echo "teardown(): BATS_TEST_DIRNAME="$BATS_TEST_DIRNAME
#	 echo "teardown(): BATS_TEST_NAMES="$BATS_TEST_NAMES
#	 echo "teardown(): BATS_TEST_NAME="$BATS_TEST_NAME
#	 echo "teardown(): BATS_TEST_DESCRIPTION="$BATS_TEST_DESCRIPTION
#	 echo "teardown(): BATS_TEST_NUMBER="$BATS_TEST_NUMBER
#	 echo "teardown(): BATS_TMPDIR="$BATS_TMPDIR

	 echo "teardown(): LOGFILE="$LOGFILE
	 echo "teardown(): $LOGFILE =>"
	 cat $LOGFILE

	 echo "teardown(): finish."
}

function setup() {
	 echo "setup(): ..."
	 LOGFILE="/tmp/$BATS_TEST_DESCRIPTION.log"
	 echo "setup(): finished."
}	 

#@test "test-locpick-start" {
#         log_start		   
#	 result="$(echo 2)"
#	 log "output = ${output}"
#	 log "status = ${status}"
#	 log "result = ${result}"
# 	 log "check result.."
#	 [ "$result" -eq 1 ]
#	 log "here I am logging"
#	 log_finish
#}

@test "test-locpick-start" {
    log_start
    
#    cd ../locpick/locpick-msvc/app

    (LOG_LEVEL=DEBUG node locpick.js &>> $LOGFILE)&
    LOCPICK_PID=$!

    log "LOCPICK_PID="$LOCPICK_PID

    waitforpass $LOGFILE  "Cannot find module" 100 true

    #    failtest
    log_finish 
}
