# make log-clean all log-dump

SRC_DIR := "../../src/locpick/locpick-msvc/app"

all: test-api

test-prereq:
	cd ${SRC_DIR}; yarn

test-api:
	./test-api.sh

log-dump:
	cat /tmp/test-*.log

log-clean:
	rm /tmp/test-*.log
