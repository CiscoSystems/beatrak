#!/usr/bin/env bats

SRC_DIR="../../src/locpick/locpick-msvc/app"

. ../helpers/helpers.bash
#load ../helpers/helpers

function teardown() {
         echo "" &> /dev/null
	 echo "teardown(): start..."

	 kill_locpick
	 
	 echo "teardown(): LOGFILE="$LOGFILE
	 echo "teardown(): $LOGFILE =>"
	 cat $LOGFILE

	 echo "teardown(): finish."
}

function setup() {
	 echo "setup(): ..."
	 LOGFILE="/tmp/$BATS_TEST_DESCRIPTION.log"
	 log "SRC_DIR="$SRC_DIR
	 cd $SRC_DIR
	 (LOG_LEVEL=DEBUG node server.js &>> $LOGFILE)&
	 LOCPICK_PID=$!
	 echo "setup(): finished."
}	 

@test "test-locpick-start-v0.1" {
    log_start
    
    waitforpass $LOGFILE  "main(): locpick server on http://127.0.0.1:8080" 20 true

    #    failtest
    log_finish 
}
