# make log-clean all log-dump

SRC_DIR := "../../src"

LOCPICK_DIR := ${SRC_DIR}"/locpick/locpick-msvc"
BEACON_DIR  := ${SRC_DIR}"/beacon/beacon-msvc"

show:
	@echo ${SRC_DIR}
	@echo ${LOCPICK_DIR}


all: test-api

all-debug: log-clean test-api log-dump

test-prep:
	cp -rf ${SRC_DIR}/common ${LOCPICK_DIR}/
	cp -rf ${SRC_DIR}/common ${BEACON_DIR}

test-prereq-old:
	cp -rf ../../src/common/ ../../src/locpick/locpick-msvc/

test-prereq:
	cp -rf ${SRC_DIR}/common ${LOCPICK_DIR}
	cd ${LOCPICK_DIR}/common; yarn
	cp -rf ${SRC_DIR}/common ${BEACON_DIR}
	cd ${BEACON_DIR}/common; yarn

	cd ${LOCPICK_DIR}/app; yarn
	cd ${BEACON_DIR}/app; yarn

	$(MAKE) -C ${SRC_DIR}/keys

test-api:
	./test-api.sh

log-dump:
	-@cat /tmp/test-api.sh.log 2> /dev/null
	-@cat /tmp/test-locpick-*.log 2> /dev/null
	-@cat /tmp/test-beacon-*.log 2> /dev/null

log-clean:
	rm -if /tmp/test-locpick-*.log
	rm -if /tmp/test-beacon-*.log
