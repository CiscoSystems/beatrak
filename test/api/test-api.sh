#!/usr/bin/env bash
set -e

. ../helpers/helpers.bash

# Tests to run. Defaults to all.
TESTS=${@:-.}

# Run the tests.
execute time bats --tap $TESTS
