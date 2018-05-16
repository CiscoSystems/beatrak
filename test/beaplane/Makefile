# make log-clean all log-dump

export SRC_DIR := ${PWD}/../../src
OBUS_DIR := ${SRC_DIR}/obus

#all: test-beaplane
all: all-debug

all-debug: log-clean test-beaplane log-dump

test-prereq:
	cp -rf ${SRC_DIR}/common ${OBUS_DIR}/common
	cd ${OBUS_DIR}/common; yarn
	cd ${SRC_DIR}/obus; yarn

test-beaplane: log-clean
	./test-beaplane.sh

log-dump:
	-@cat /tmp/test-obus-server-60001-run.log 2> /dev/null
	-@cat /tmp/test-beaplane.sh.log 2> /dev/null
	-@cat /tmp/test-beaplane-*.log 2> /dev/null

log-clean:
	-@rm -if /tmp/test-*.log

log-show:
	-@ls -l /tmp/test-*.log

