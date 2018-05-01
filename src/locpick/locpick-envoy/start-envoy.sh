#!/bin/bash


# just exec works
#exec /usr/local/bin/envoy -c /envoy.json
exec /usr/local/bin/envoy -c /envoy.json --restart-epoch $RESTART_EPOCH
