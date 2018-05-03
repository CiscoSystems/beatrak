# helpers

function execute() {
	>&2 echo "++ $@"
	eval "$@"
}

function log_start() {
	 echo "--------------------------" $1 &> $LOGFILE
	 echo "- @$BATS_TEST_DESCRIPTION" $1 &>> $LOGFILE
	 echo "--------------------------" $1 &>> $LOGFILE
}

function log() {
	 echo "@$BATS_TEST_DESCRIPTION:" $1 &>> $LOGFILE
}

function log_finish() {
	 echo "@$BATS_TEST_DESCRIPTION: FINISH" $1 &>> $LOGFILE
}
