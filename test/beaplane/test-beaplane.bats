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


@test "test-envoy-config-v1-run" {
    ts
    kill_envoy
    kill_beaplane

    run_beaplane $BEAPLANE_LOGFILE
    waitforpass $BEAPLANE_LOGFILE \
		"manager listening on localhost:55555" \
		50 true

    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-static-eds-obus-node-01-v1.yaml $ENVOY_LOGFILE
    waitforpass $ENVOY_LOGFILE \
		"all dependencies initialized. starting workers" \
		100 true
    
    bucket=bucket-eds-60001-obus-node-01-v1.yaml
    run "curl" "-XPOST" "-sS" "localhost:60011/bucket" "--data-binary" "@buckets/$bucket" "-H" "Content-type: text/x-yaml"
    log "$bucket: $output"
    
    waitforpass $LOGFILE \
		"$bucket: beaplane: OK: loaded bucket" \
		200 true

    waitforpass $BEAPLANE_LOGFILE \
		"beaplane.go: handlers.handleBucket(): bucket snapshot =>*{Endpoints:{Version:$bucket Items:[cluster_name:*obus-server-60001" \
		200 true
    

    (HOST=localhost PORT=55001 LABEL=obus-client-test-integration DEBUG=obus:* node ../../src/obus/obus.js >> $LOGFILE)&
    pid=$!
    write_obus_client_pid $pid

    waitforpass $LOGFILE \
		"obus.js: runPing(): ping(): received response = {\"ServerID\":\"obus-server-60001\"" \
		200 true
    kill $pid
}

@test "test-envoy-config-v2-run" {
    ts
    kill_envoy

    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-eds-rds-obus-node-01-v2.yaml
    waitforpass $LOGFILE \
		"all dependencies initialized. starting workers" \
		100 true
    
    bucket=bucket-eds-rds-60001-obus-node-01-v2.yaml
    run "curl" "-XPOST" "-sS" "localhost:60011/bucket" "--data-binary" "@buckets/$bucket" "-H" "Content-type: text/x-yaml"
    log "$bucket: $output"
    
    waitforpass $LOGFILE \
		"$bucket: beaplane: OK: loaded bucket" \
		200 true

    waitforpass $BEAPLANE_LOGFILE \
		"beaplane.go: handlers.handleBucket(): bucket snapshot =>*{Endpoints:{Version:$bucket Items:[cluster_name:*obus-server-60001" \
		200 true


    (HOST=localhost PORT=55001 LABEL=obus-client-test-integration DEBUG=obus:* node ../../src/obus/obus.js >> $LOGFILE)&
    pid=$!
    write_obus_client_pid $pid
    
    waitforpass $LOGFILE \
		"obus.js: runPing(): ping(): received response = {\"ServerID\":\"obus-server-60001\"" \
		250 true

    kill $pid

}

@test "test-obus-server-60002-run" {
    ts

    run_obus_server_60002 $OBUS_SERVER_60002_LOGFILE

    waitforpass $OBUS_SERVER_60002_LOGFILE \
		"log: obus-server: OK: listening on PORT=60002" \
		20 true
}

@test "test-envoy-config-v3-run" {
    ts
    kill_envoy

    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-eds-rds-obus-node-01-v3.yaml
    waitforpass $LOGFILE \
		"all dependencies initialized. starting workers" \
		100 true

    bucket=bucket-eds-rds-60001-60002-obus-node-01-v3.yaml
    run "curl" "-XPOST" "-sS" "localhost:60011/bucket" "--data-binary" "@buckets/$bucket" "-H" "Content-type: text/x-yaml"
    log "$bucket: $output"
    
    waitforpass $LOGFILE \
		"$bucket: beaplane: OK: loaded bucket" \
		200 true

}

@test "test-obus-client-60001-60002-v3-run" {
    ts

    kill_envoy

    run_envoy ${ENVOY_CONFIG_DIR}/envoy-beaplane-eds-rds-obus-node-01-v3.yaml
    waitforpass $LOGFILE \
		"all dependencies initialized. starting workers" \
		100 true
    
    (HOST=localhost PORT=55001 LABEL=obus-client-test-integration-60001 DEBUG=obus:* node ../../src/obus/obus.js >> $OBUS_CLIENT_LOGFILE)&
    pid=$!
    write_obus_client_pid $pid

    waitforpass $OBUS_CLIENT_LOGFILE \
		"obus.js: runPing(): ping(): received response = {\"ServerID\":\"obus-server-60001\"" \
		500 true


    waitforpass $OBUS_CLIENT_LOGFILE \
		"obus.js: runPing(): ping(): received response = {\"ServerID\":\"obus-server-60002\"" \
		500 true
    
    kill $pid
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

@test "test-obus-clients-killall" {
    ts
    killall_obus_clients
}
