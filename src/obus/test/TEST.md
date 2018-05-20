## obus test

### obus/test/test-locpick.sh (locpick integration http/grpc tests with obus)
- **test-locpick-start: {server http}** 
  - starts HTTP API server
- **test-locpick-start: {server grpc}** 
  - starts GRPC API server
- **test-locpick-start: {server grpc tls}** 
  - starts TLS GRPC API server
- **test-locpick-http-info**
  - gets info via HTTP API 
- **test-locpick-grpc-info**
  - gets info via GRPC API
- **test-locpick-grpc-ping**
  - does ping via GRPC API 
- **test-locpick-grpc-tls-info**
  - gets info via GRPC API

### obus/test/test-beacon.sh (beacon integration http/grpc tests with obus)
- **test-beacon-start: {locpick http info}**
  - checks locpick->beacon HTTP API
- **test-beacon-start: {locpick grpc info}**
  - checks locpick->beacon GRPC API
- **test-beacon-start: {locpick grpc info}**
  - checks locpick->beacon GRPC API
- **test-beacon-start: {locpick grpc tls info}**
  - checks locpick->beacon GRPC API
- **test-beacon-start: {beacon server http}**
  - starts HTTP API server
- **test-beacon-start: {beacon server grpc}**
  - starts HTTP API server
- **test-beacon-start: {beacon location grpc tls}**
  - get location from locpick, both TLS GRPC client and server
- **test-beacon-start: {beacon init}**
  - checks full successful init
- **test-beacon-http-info**
  - gets info via HTTP API 
- **test-beacon-grpc-info**
  - gets info via GRPC API 

```
[.../beatrak/src/obus]$ make test-locpick test-beacon
obus: test-locpick.sh: test-locpick-start: ...
/Users/dchtchou/src/github.com/cdmitri/beatrak/src/obus
obus: test-locpick.sh: test-locpick-start: {server http}: -> PASS
obus: test-locpick.sh: test-locpick-start: {server grpc}: -> PASS
obus: test-locpick.sh: test-locpick-start: {server grpc tls}: -> PASS
obus: test-locpick.sh: test-locpick-http-info: ...
obus: test-locpick.sh: test-locpick-http-info: -> PASS
obus: test-locpick.sh: test-locpick-grpc-ping: ...
obus: test-locpick.sh: test-locpick-grpc-ping: -> PASS
obus: test-locpick.sh: test-locpick-grpc-info: ...
obus: test-locpick.sh: test-locpick-grpc-info: -> PASS
obus: test-locpick.sh: test-locpick-grpc-tls-info: ...
obus: test-locpick.sh: test-locpick-grpc-tls-info: -> PASS
obus: test-locpick.sh: -> PASS
obus: test-beacon.sh: test-locpick-start: ...
obus: test-beacon.sh: test-locpick-start: {http}: -> PASS
obus: test-beacon.sh: test-locpick-start: {grpc}: -> PASS
obus: test-beacon.sh: test-beacon-start: ...
obus: test-beacon.sh: test-beacon-start: {locpick http info}: -> PASS
obus: test-beacon.sh: test-beacon-start: {locpick grpc info}: -> PASS
obus: test-beacon.sh: test-beacon-start: {beacon server http}: -> PASS
obus: test-beacon.sh: test-beacon-start: {beacon server grpc}: -> PASS
obus: test-beacon.sh: test-beacon-start: {beacon init}: -> PASS
obus: test-beacon.sh: test-beacon-http-info: ...
obus: test-beacon.sh: test-beacon-http-info: -> PASS
obus: test-beacon.sh: test-beacon-grpc-info: ...
obus: test-beacon.sh: test-beacon-grpc-info: -> PASS
obus: test-beacon.sh: -> PASS
```
