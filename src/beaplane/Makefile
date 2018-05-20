.DEFAULT_GOAL	:= all

ENVOY_BUILD_PATH=/Users/dchtchou/src/github.com/cdmitri/envoy/bazel-bin/source/exe
ENVOY_INSTALL_DIR=/usr/local/bin

all:
	@echo "No default goals"
##
## ENVOY
##
envoy-copy:
	cp ${ENVOY_BUILD_PATH}/envoy-static ./envoy

envoy-install:
	cp ${ENVOY_BUILD_PATH}/envoy-static ${ENVOY_INSTALL_DIR}/envoy

envoy-run: ENVOY_CONFIG=envoy-beaplane-static-eds-rds-obus-node-01.yaml
envoy-run:
	${ENVOY_INSTALL_DIR}/envoy -c ./test/${ENVOY_CONFIG} --drain-time-s 1 --v2-config-only

##
## BEAPLANE
##
beaplane-run:
	./beaplane -trace

##
## OBUS
##
obus-client-run: export HOST=localhost
obus-client-run: export PORT=55001
obus-client-run: export LABEL=obus-client-to-envoy
obus-client-run:
	DEBUG=obus:* nodemon ../obus/obus.js envoy

obus-client-60001-run: export HOST=localhost
obus-client-60001-run: export PORT=60001
obus-client-60001-run: export LABEL=obus-client-to-envoy
obus-client-60001-run:
	DEBUG=obus:* nodemon ../obus/obus.js envoy


##
## OBUS-SERVER
##
obus-server-run-60001:
	rm -f /tmp/obus-server*.log; DEBUG=obus-server:* PORT=60001 ID=60001 forever start --minUptime=1000 --spinSleepTime=1000  -l /tmp/obus-server-60001-log.log -o /tmp/obus-server-60001-out.log -e /tmp/obus-server-60001-error.log ../obus/obus-server.js

obus-server-run-60002:
	rm -f /tmp/obus-server*.log; DEBUG=obus-server:* PORT=60002 ID=60002 forever start --minUptime=1000 --spinSleepTime=1000 -l /tmp/obus-server-60002-log.log -o /tmp/obus-server-60002-out.log -e /tmp/obus-server-60002-error.log ../obus/obus-server.js

obus-server-runall: obus-server-run-60001 obus-server-run-60002

obus-server-stopall:
	forever stopall

##
## TEST
##
.PHONY: test
test: test-integration

.PHONY: test-integration
test-integration:
	@test/test-integration.sh

.PHONY: test-go
test-go:
	@go test -test.v ./test

##
## BUILD
##
.PHONY: go
# unset GOPATH so that we read from this ./vendor
go:
	GOPATH= go run beaplane.go -trace

.PHONY: build
build:
#	GOPATH= go build beaplane.go
	go build beaplane.go

.PHONY: run
run:
	./beaplane





