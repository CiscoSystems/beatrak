### beaplane build
```sh
[user@beatrak beatrak]$ make beaplane-build 
go get github.com/envoyproxy/go-control-plane/envoy/api/v2
go get github.com/sirupsen/logrus
go get gopkg.in/yaml.v2
make -C src/beaplane build
make[1]: Entering directory `/home/user/src/github.com/user/beatrak/src/beaplane'
GOPATH= go build beaplane.go
make[1]: Leaving directory `/home/user/src/github.com/user/beatrak/src/beaplane'
```
