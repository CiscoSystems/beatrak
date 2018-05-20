all:

##
## BULD
##
build: obus-build
obus-build:
	yarn
##
## TEST
##
.PHONY: test
test: cleanup
test: export DO_CLEANUP=false
test: test-locpick
test: test-beacon
test: cleanup
test:

cleanup:
	@echo "make: cleanup: killing leftover procs"
	@$(MAKE) locpick-kill
	@$(MAKE) beacon-kill
	@rm -f /tmp/test-*

.PHONY: test-integration
test-integration:
	@test/test-integration.sh

.PHONY: test-locpick
test-locpick:
	@test/test-locpick.sh

.PHONY: test-locpick
test-beacon:
	@test/test-beacon.sh


# do all the killing here
# 22913 ttys000    0:00.29 node locpick.js
locpick-kill:
	@echo "make: locpick-kill: kill all locpicks"
	-@kill `ps -ae | grep "locpick.js" | grep -v "grep" | awk '{print $1}'` &> /dev/null

beacon-kill:
	@echo "make: beacon-kill: kill all beacons"
	-@kill `ps -ae | grep "beacon.js" | grep -v "grep" | awk '{print $1}'` &> /dev/null


##
## TODO: test more
##
obus-client-run: export HOST=localhost
obus-client-run: export PORT=55001
obus-client-run: export LABEL=obus-client-to-envoy
obus-client-run:
	DEBUG=obus:* nodemon obus.js envoy
