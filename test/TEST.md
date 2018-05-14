```sh
[user@beatrak beatrak]$ cd test/api
[user@beatrak api]$ make test-prereq
[user@beatrak api]$ make all
./test-api.sh
TESTS=.
/home/cdmitri/src/github.com/ciscosystems/beatrak/test/api
/home/cdmitri/src/github.com/ciscosystems/beatrak/test/api
++ time bats --tap .
1..8
ok 1 test-beacon-locpick-run-fail-v0.1
ok 2 test-locpick-run-v0.1
ok 3 test-locpick-get-info-v0.1
ok 4 test-locpick-get-locs-v0.1
ok 5 test-locpick-get-loc-nozone-v0.1
ok 6 test-locpick-get-loc-zone-v0.1
ok 7 test-locpick-reset-v0.1
ok 8 test-locpick-get-config-v0.1

real	0m7.359s
user	0m0.890s
sys	0m0.204s
```

