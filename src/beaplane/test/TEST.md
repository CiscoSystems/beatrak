## test

### test/test-integration.sh

- **test-obus-server-60001-start** 
  - starts server on localhost:60001 that will respond to single client requests
- **test-beaplane-start**
  - starts beaplane, no initial configuration
- **test-envoy-start-v1**
  - starts envoy with v1 config, single static cluster with EDS
  - *id*: obus-node-01
  - *route match*: "/obus."
  - *route*: cluster: obus-server-60001
  - *clusters*: name obus-server-60001, type: EDS
- **test-beaplane-bucket-v1**
  - load beaplane with v1 bucket
  - *id*: obus-node-01
  - *endpoints*: cluster_name: obus-server-60001, hosts: localhost:60001
- **test-obus-client-v1**
  - client sends request to envoy on localhost:55001, gets response from obus-server-60001
- **test-envoy-start-v2**
  - starts envoy with v2 config, route RDS, single cluster EDS
  - *id*: obus-node-01
  - *route*: RDS
  - *clusters*: name: obus-server-60001, type: EDS
- **test-beaplane-bucket-v2**
  - load beaplane with v2 bucket
  - *id*: obus-node-01
  - *endpoints*: cluster_name: obus-server-60001, hosts: localhost:60001
  - *routes*: match: "./obus", cluster: "obus-server-60001"
- **test-obus-client-v2**
  - client sends request to envoy on localhost:55001, gets response from obus-server-60001
- **test-obus-server-60002-start**
  - starts server on localhost:60002 that will respond to single client requests
- **test-envoy-start-v3**
  - starts envoy with v3 config, route RDS, 2 clusters EDS
  - *id*: obus-node-01
  - *route*: RDS
  - *clusters*: {cluster: obus-server-60001,type: EDS},{cluster:obus-server-60002,type:EDS}
- **test-beaplane-bucket-v3**
  - load beaplane with v3 bucket
  - *id*: obus-node-01
  - *endpoints*: {cluster_name: obus-server-60001, hosts: localhost:60001},{cluster_name: obus-server-60002,hosts: localhost:60002}
  - *route match*: "/obus."
  - *route*: weighted_clusters: {cluster:obus-server-60001, weight: 50},{cluster: obus-server-60002,weight: 50}
- **test-obus-client-60001-v3**
  - client sends request to envoy on localhost:55001, gets response from obus-server-60001
- **test-obus-client-60002-v3**
  - client sends request to envoy on localhost:55001, gets response from obus-server-60002

```
[.../beatrak/src/beaplane]$ make test 2>/dev/null
test-integration.sh: RUN
test-integration.sh: test-obus-server-60001-start: ...
test-integration.sh: test-obus-server-60001-start: -> PASS
test-integration.sh: test-beaplane-start: ...
test-integration.sh: test-beaplane-start: -> PASS
test-integration.sh: test-envoy-start-v1: ...
test-integration.sh: test-envoy-start-v1: kill old envoy
test-integration.sh: test-envoy-start-v1: -> PASS
test-integration.sh: test-beaplane-bucket-v1: ...
test-integration.sh: test-beaplane-bucket-v1: -> PASS
test-integration.sh: test-obus-client-v1: ...
test-integration.sh: test-obus-client-v1: kill old client
test-integration.sh: test-obus-client-v1: -> PASS
test-integration.sh: test-envoy-start-v2: ...
test-integration.sh: test-envoy-start-v2: kill old envoy
test-integration.sh: test-envoy-start-v2: -> PASS
test-integration.sh: test-beaplane-bucket-v2: ...
test-integration.sh: test-beaplane-bucket-v2: -> PASS
test-integration.sh: test-obus-client-v2: ...
test-integration.sh: test-obus-client-v2: kill old client
test-integration.sh: test-obus-client-v2: -> PASS
test-integration.sh: test-obus-server-60002-start: ...
test-integration.sh: test-obus-server-60002-start: -> PASS
test-integration.sh: test-envoy-start-v3: ...
test-integration.sh: test-envoy-start-v3: kill old envoy
test-integration.sh: test-envoy-start-v3: -> PASS
test-integration.sh: test-beaplane-bucket-v3: ...
test-integration.sh: test-beaplane-bucket-v3: -> PASS
test-integration.sh: test-obus-client-60001-v3: ...
test-integration.sh: test-obus-client-60001-v3: kill old client
test-integration.sh: test-obus-client-60001-v3: -> PASS
test-integration.sh: test-obus-client-60002-v3: ...
test-integration.sh: test-obus-client-60002-v3: kill old client
test-integration.sh: test-obus-client-60002-v3: -> PASS
test-integration.sh: -> PASS
```
