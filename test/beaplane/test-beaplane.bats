. ../helpers/common-helpers.bash
. ../helpers/beaplane-helpers.bash

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
}

@test "test-beaplane-run" {
    ts
    run_beaplane
    waitforpass $LOGFILE \
		"manager listening" \
		20 true
}

@test "test-envoy-run" {
    ts
    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-static-eds-obus-node-01-v1.yaml
    waitforpass $LOGFILE \
		"starting main dispatch loop" \
		50 true
    kill_envoy
}


@test "test-envoy-config-v1" {
    ts
    kill_envoy
    kill_beaplane

    run_beaplane
        waitforpass $LOGFILE \
		"manager listening on localhost:55555" \
		50 true

    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-static-eds-obus-node-01-v1.yaml
    waitforpass $LOGFILE \
		"all dependencies initialized. starting workers" \
		100 true
    

    bucket=buckets/bucket-eds-60001-obus-node-01-v1.yaml
    (curl -XPOST -sS "localhost:60011/bucket" --data-binary @$bucket -H "Content-type: text/x-yaml" &>>$LOGFILE)&

    waitforpass $LOGFILE \
		"beaplane: OK: loaded bucket" \
		200 true

    (HOST=localhost PORT=55001 LABEL=obus-client-test-integration DEBUG=obus:* node ../../src/obus/obus.js >> $LOGFILE)&
    OBUS_CLIENT_PID=$!

    waitforpass $LOGFILE \
		"obus.js: runPing(): ping(): received response = {\"ServerID\":\"obus-server-60001\"" \
		200 true

    kill $OBUS_CLIENT_PID

}



@test "test-envoy-kill" {
    ts
    kill_envoy
    waitforpass $LOGFILE \
		"@test-envoy-kill: KILL_ENVOY(): finish." \
		20 true
}

@test "test-beaplane-kill" {
    ts
    kill_beaplane
    waitforpass $LOGFILE \
		"@test-beaplane-kill: KILL_BEAPLANE(): finish." \
		20 true
}



