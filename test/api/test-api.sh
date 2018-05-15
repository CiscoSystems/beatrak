#!/usr/bin/env bash
set -e

. ../helpers/helpers.bash

#SRC_DIR="../../src"

# tests to run. Defaults to all.
#TESTS=${@:-.}

# setup the suite
rm -f /tmp/locpick.pid
rm -f /tmp/beacon.pid

LOGFILE=/tmp/test-api.sh.log
BATS_TEST_DESCRIPTION="test-api.sh"
log_start
export LOCPICK_HTTP_HOST="localhost"
export LOCPICK_HTTP_PORT=58080
export LOCPICK_GRPC_HOST="localhost"
export LOCPICK_GRPC_PORT=58085
export LOCPICK_GRPC_TLS_PORT=58090
run_locpick


TESTS="test-api-locpick.bats"
execute time bats --tap $TESTS || true
LOGFILE=/tmp/test-api.sh.log
kill_locpick

export BEACON_HTTP_HOST="localhost"
export BEACON_HTTP_PORT=8080
export BEACON_GRPC_HOST="localhost"
export BEACON_GRPC_PORT=8085
export ZONE="zb"
s_dir=${PWD}"/../../src"
export BEACON_TLS_CA_CERT=${s_dir}"/keys/beatrak-ca-cert.pem"
export BEACON_TLS_SERVER_KEY=${s_dir}"/keys/beatrak-server-key.pem"
export BEACON_TLS_SERVER_CERT=${s_dir}"/keys/beatrak-server-cert.pem"
export BEACON_TLS_CLIENT_KEY=${s_dir}"/keys/beatrak-client1-key.pem"
export BEACON_TLS_CLIENT_CERT=${s_dir}"/keys/beatrak-client1-cert.pem"
export LOCPICK_TLS_CA_CERT=${s_dir}"/keys/beatrak-ca-cert.pem"
export LOCPICK_TLS_CLIENT_KEY=${s_dir}"/keys/beatrak-client1-key.pem"
export LOCPICK_TLS_CLIENT_CERT=${s_dir}"/keys/beatrak-client1-cert.pem"
export OBUS_TLS_CA_CERT=${s_dir}"/keys/beatrak-ca-cert.pem"
export OBUS_TLS_CLIENT_KEY=${s_dir}"/keys/beatrak-client1-key.pem"
export OBUS_TLS_CLIENT_CERT=${s_dir}"/keys/beatrak-client1-cert.pem"

run_locpick
run_beacon

TESTS="test-api-beacon.bats"
execute time bats --tap $TESTS || true

# cleanup
LOGFILE=/tmp/test-api.sh.log
kill_locpick
kill_beacon
log_finish
