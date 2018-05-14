#!/usr/bin/env bash
set -e

. ../helpers/helpers.bash

# tests to run. Defaults to all.
TESTS=${@:-.}
#TESTS="test-api-locpick.bats"
#TESTS="test-api-beacon.bats"

echo "TESTS="$TESTS

# setup the suite

rm -f /tmp/locpick.pid
rm -f /tmp/beacon.pid

LOGFILE=/tmp/test-api.sh.log
BATS_TEST_DESCRIPTION="test-api.sh"
log_start
run_locpick
run_beacon

# run the tests.
# we need to clean up to ignore error
execute time bats --tap $TESTS || true

# cleanup
LOGFILE=/tmp/test-api.sh.log
#echo "test-api.sh: LOCPICK_PIDS="${LOCPICK_PIDS[@]}
#echo "test-api.sh: LOCPICK_PIDS length="${#LOCPICK_PIDS[@]}
kill_locpick
log_finish








