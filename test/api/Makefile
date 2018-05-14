# make log-clean all log-dump

SRC_DIR := "../../src"

LOCPICK_DIR := ${SRC_DIR}"/locpick/locpick-msvc/app"
BEACON_DIR  := ${SRC_DIR}"/beacon/beacon-msvc/app"

all: test-api

all-debug: log-clean; make test-api; make log-dump

test-prereq:
	cd ${LOCPICK_DIR}; yarn
	cd ${BEACON_DIR}; yarn

test-api:
	./test-api.sh

log-dump:
	-@cat /tmp/test-api.sh.log 2> /dev/null
	-@cat /tmp/test-locpick-*.log 2> /dev/null
	-@cat /tmp/test-beacon-*.log 2> /dev/null

log-clean:
	rm -if /tmp/test-locpick-*.log
	rm -if /tmp/test-beacon-*.log
