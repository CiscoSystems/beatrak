# make log-clean all log-dump

SRC_DIR := "../../src/locpick/locpick-msvc/app"

all: test-api

test-prereq:
	cd ${SRC_DIR}; yarn

test-api:
	./test-api.sh

log-dump:
	@cat /tmp/test-locpick-run*.log
	@cat /tmp/test-locpick-info*.log

log-clean:
	rm -if /tmp/test-locpick-*.log
