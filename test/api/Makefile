# make log-clean all log-dump

SRC_DIR := "../../src/locpick/locpick-msvc/app"

#all: test-api

all: log-clean; make test-api; make log-dump

test-prereq:
	cd ${SRC_DIR}; yarn

test-api:
	./test-api.sh

log-dump:
	-@cat /tmp/test-api.sh.log 2> /dev/null
#	-@cat /tmp/test-locpick-run*.log 2> /dev/null
#	-@cat /tmp/test-locpick-info*.log 2> /dev/null
	-@cat /tmp/test-locpick-*.log 2> /dev/null

log-clean:
	rm -if /tmp/test-locpick-*.log
