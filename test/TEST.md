```sh
[user@beatrak beatrak]$ cd test/api
[user@beatrak api]$ make test-prereq
[user@beatrak api]$ make all
[cdmitri@beatrak api]$ make
./test-api.sh
/home/cdmitri/src/github.com/cdmitri/beatrak/test/api
++ time bats --tap test-api-locpick.bats
1..7
ok 1 test-locpick-run
ok 2 test-locpick-http-get-info
ok 3 test-locpick-http-get-locs
ok 4 test-locpick-http-gen-nozone
ok 5 test-locpick-http-gen-loc-zone
ok 6 test-locpick-http-reset
ok 7 test-locpick-http-get-config

real	0m8.008s
user	0m0.611s
sys	0m0.171s
/home/cdmitri/src/github.com/cdmitri/beatrak/test/api
/home/cdmitri/src/github.com/cdmitri/beatrak/test/api
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

real	0m10.103s
user	0m4.263s
sys	0m0.294s
```

