#!/usr/bin/env bash
set -e
set -o errexit
set -o nounset
set -o pipefail

. ../helpers/common-helpers.bash
. ../helpers/beaplane-helpers.bash

XDS=${XDS:-xds}

# Envoy start-up command
ENVOY=${ENVOY:-/usr/local/bin/envoy}

BEAPLANE_DEBUG_FLAG=-debug

# tests to run. Defaults to all.
#TESTS=${@:-.}

LOGFILE=/tmp/test-beaplane.sh.log
BATS_TEST_DESCRIPTION="test-beaplane.sh"
log_start

run_obus_server_60001 

TESTS="test-beaplane.bats"
execute time bats --tap $TESTS || true

#kill_obus_server_60001
kill_obus_server_all

log_finish
