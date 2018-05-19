all:

test:
	@echo "--------------------------------------"
	@echo "- test prereq"
	@echo "--------------------------------------"
	$(MAKE) -C api test-prereq
	$(MAKE) -C beaplane test-prereq
	@echo "--------------------------------------"
	@echo "- test"
	@echo "--------------------------------------"
	$(MAKE) -C api test
	$(MAKE) -C beaplane test

