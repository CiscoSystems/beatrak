```sh
# envoy
bazel fetch //source/...
bazel build //source/exe:envoy-static

# run tests
cd beatrak
make build-all

cd test/api
make test-prereq
make all-debug

cd test/beaplane
make test-prereq
make all-debug
```

```sh
[user@beatrak beatrak]$ make test-all
make test-api
make[1]: Entering directory `/home/user/src/github.com/user/beatrak'
make -C ./test/api  test-api
make[2]: Entering directory `/home/user/src/github.com/user/beatrak/test/api'
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

real	0m8.213s
user	0m0.605s
sys	0m0.141s
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

real	0m10.150s
user	0m4.297s
sys	0m0.235s
make[2]: Leaving directory `/home/user/src/github.com/user/beatrak/test/api'
make[1]: Leaving directory `/home/user/src/github.com/user/beatrak'
```

