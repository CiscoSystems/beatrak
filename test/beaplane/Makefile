# make log-clean all log-dump

#export SRC_DIR := ${PWD}/../../src

SRC_DIR := "../../src"

OBUS_DIR := ${SRC_DIR}/obus

export ENVOY=/home/cdmitri/src/github.com/envoyproxy/envoy/bazel-bin/source/exe/envoy-static
export ENVOY_CONFIG_DIR=/home/cdmitri/src/github.com/cdmitri/beatrak/test/beaplane/envoy-configs

export BEAPLANE_SRC_DIR="~/src/github.com/cdmitri/beatrak"
export BEAPLANE=${BEAPLANE_SRC_DIR}/src/beaplane/beaplane

#all: test-beaplane
all: all-debug

test: test-beaplane

all-debug: log-clean test-beaplane log-dump

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
	-@cat /tmp/test-envoy-config-v1.log 2> /dev/null

log-clean:
	-@rm -if /tmp/test-*.log

log-show:
	-@ls -l /tmp/test-*.log

