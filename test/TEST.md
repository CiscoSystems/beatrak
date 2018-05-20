```sh
# envoy
bazel fetch //source/...
bazel build //source/exe:envoy-static

# run tests
cd beatrak/test
make test
```

```sh
[user@beatrak beatrak]$ make test
--------------------------------------
- test prereq
--------------------------------------
...
--------------------------------------
- verifying CLIENT N CERT pem(s)
--------------------------------------
...
--------------------------------------
- test
--------------------------------------
make -C api test
make[1]: Entering directory '/home/user/src/github.com/user/beatrak/test/api'
./test-api.sh
/home/user/src/github.com/user/beatrak/test/api
++ time bats --tap test-api-locpick.bats
1..7
ok 1 test-locpick-run
ok 2 test-locpick-http-get-info
ok 3 test-locpick-http-get-locs
ok 4 test-locpick-http-gen-nozone
ok 5 test-locpick-http-gen-loc-zone
ok 6 test-locpick-http-reset
ok 7 test-locpick-http-get-config

real	0m7.617s
user	0m0.428s
sys	0m0.040s
/home/user/src/github.com/user/beatrak/test/api
/home/user/src/github.com/user/beatrak/test/api
++ time bats --tap test-api-beacon.bats
1..9
ok 1 test-beacon-locpick-run
ok 2 test-beacon-run
ok 3 test-beacon-locpick-http-info
ok 4 test-beacon-locpick-grpc-info
ok 5 test-beacon-locpick-grpc-tls-info
ok 6 test-beacon-http-server-init
ok 7 test-beacon-grpc-init
ok 8 test-beacon-get-loc
ok 9 test-beacon-init-done

real	0m8.646s
user	0m2.976s
sys	0m0.052s
make[1]: Leaving directory '/home/user/src/github.com/user/beatrak/test/api'
make -C beaplane test
make[1]: Entering directory '/home/user/src/github.com/user/beatrak/test/beaplane'
./test-beaplane.sh
++ time bats --tap test-beaplane.bats
1..11
ok 1 test-obus-server-60001-run
ok 2 test-beaplane-run
ok 3 test-envoy-run
ok 4 test-envoy-config-v1-run
ok 5 test-envoy-config-v2-run
ok 6 test-obus-server-60002-run
ok 7 test-envoy-config-v3-run
ok 8 test-obus-client-60001-60002-v3-run
ok 9 test-envoy-kill
ok 10 test-beaplane-kill
ok 11 test-obus-clients-killall

real	0m14.858s
user	0m2.284s
sys	0m0.196s
make[1]: Leaving directory '/home/user/src/github.com/user/beatrak/test/beaplane'
user@beatrak-ubuntu16:~/src/github.com/user/beatrak/test$ 
```

