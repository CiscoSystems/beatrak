# make log-clean all log-dump

#export SRC_DIR := ${PWD}/../../src

SRC_DIR := "../../src"

OBUS_DIR := ${SRC_DIR}/obus

export ENVOY=/home/cdmitri/src/github.com/envoyproxy/envoy/bazel-bin/source/exe/envoy-static
export ENVOY_CONFIG_DIR=/home/cdmitri/src/github.com/cdmitri/beatrak/test/beaplane/envoy-configs
export ENVOY_LOGFILE=/tmp/envoy.log


export BEAPLANE_SRC_DIR=~/src/github.com/cdmitri/beatrak
export BEAPLANE=${BEAPLANE_SRC_DIR}/src/beaplane/beaplane
export BEAPLANE_LOGFILE=/tmp/beaplane.log

export OBUS_SERVER_60001_LOGFILE=/tmp/obus-server-60001.log
export OBUS_SERVER_60002_LOGFILE=/tmp/obus-server-60002.log

export OBUS_CLIENT_LOGFILE=/tmp/obus-client.log
export OBUS_CLIENT_PIDFILE=/tmp/obus-client.pid

all:

test: run-clean test-beaplane

test-debug: run-clean log-clean test-beaplane log-dump

test-prereq: 
	cp -rf ${SRC_DIR}/common ${OBUS_DIR}/common
	cd ${OBUS_DIR}/common; yarn
	cd ${SRC_DIR}/obus; yarn
	go get github.com/envoyproxy/go-control-plane/envoy/api/v2
	go get github.com/sirupsen/logrus
	go get gopkg.in/yaml.v2
	$(MAKE) -C ${SRC_DIR}/beaplane build

test-beaplane: log-clean
	./test-beaplane.sh

log-dump:
#	-@cat /tmp/test-obus-server-60001-run.log 2> /dev/null
#	-@cat /tmp/test-beaplane.sh.log 2> /dev/null
#	-@cat /tmp/test-beaplane-*.log 2> /dev/null
#	-@cat /tmp/test-envoy-*.log 2> /dev/null
#	@echo "------------------------------------------------------------"
#	-@cat /tmp/test-envoy-config-v1.log 2> /dev/null
#	@echo "------------------------------------------------------------"
	-@cat /tmp/test-envoy-config-v2.log 2> /dev/null
	@echo "------------------------------------------------------------"
	-@cat /tmp/beaplane.log 2> /dev/null
	@echo "------------------------------------------------------------"
	-@cat /tmp/envoy.log 2> /dev/null

run-clean:
	-@rm -if /tmp/envoy.pid
	-@rm -if /tmp/beaplane.pid

log-clean:
	-@rm -if /tmp/test-*.log
	-@rm -if /tmp/envoy.log
	-@rm -if /tmp/beaplane.log
	-@rm -if /tmp/obus-server-60002.log

log-show:
	-@ls -l /tmp/test-*.log

