#!/usr/bin/env bash
set -e

. ../helpers/helpers.bash

# tests to run. Defaults to all.
#TESTS=${@:-.}

TESTS="test-api-locpick.bats"

echo "TESTS="$TESTS

# setup the suite
LOGFILE=/tmp/test-api.sh.log
BATS_TEST_DESCRIPTION="test-api.sh"
log_start
run_locpick

# run the tests.
# we need to clean up to ignore error
execute time bats --tap $TESTS || true

# cleanup
LOGFILE=/tmp/test-api.sh.log
kill_locpick
log_finish




