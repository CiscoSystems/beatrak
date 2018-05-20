#!/bin/bash

# just exec works
#exec /usr/local/bin/envoy -c /envoy.json
#exec /usr/local/bin/envoy -c /envoy.json --restart-epoch $RESTART_EPOCH
exec /usr/local/bin/envoy -c /envoy-configs/envoy.yaml --drain-time-s 1 --v2-config-only --restart-epoch $RESTART_EPOCH
