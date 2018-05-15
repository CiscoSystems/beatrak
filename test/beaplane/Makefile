# make log-clean all log-dump

export SRC_DIR := ${PWD}/../../src

#all: test-beaplane
all: all-debug

all-debug: log-clean test-beaplane log-dump

test-beaplane:
	./test-beaplane.sh

log-dump:
	-@cat /tmp/test-beaplane.sh.log 2> /dev/null
	-@cat /tmp/test-beaplane-*.log 2> /dev/null

log-clean:
	-@rm -if /tmp/test-*.log
	-@rm -if /tmp/test-*.log
