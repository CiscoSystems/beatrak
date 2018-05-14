#!/usr/bin/env bash
set -e

. ../helpers/helpers.bash

# tests to run. Defaults to all.
#TESTS="test-api-locpick.bats"
TESTS=${@:-.}

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
echo "test-api.sh: LOCPICK_PIDS="${LOCPICK_PIDS[@]}
echo "test-api.sh: LOCPICK_PIDS length="${#LOCPICK_PIDS[@]}
kill_locpick
log_finish








