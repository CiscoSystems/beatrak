# beatrak
k8s &amp; envoy app

## quick start
```sh
$ cd vagrant/beatrak-centos7
$ vi Makefile
# edit Makefile, replace "beatraker" and "beatrak"
export VM_USER=beatraker
export VM_NAME=beatrak
```
#### for optional/extra packages uncomment the following line:
```sh
#export EXTRA # deploy some extra packages like emacs if defined
```
```sh
$ make create
$ make shell # will login as VM_USER above
```

*NOTE:* not using vagrant, all the setup logic is in vagrant/beatrak-centos7/bootstrap.sh

#### after above steps or on a k8s install:

if need NAT, ports that need to be forwarded:

```ruby
config.vm.network "forwarded_port", guest: 50004, host: 60004 # grafana
config.vm.network "forwarded_port", guest: 50020, host: 60020 # montrer
```

#### external links
```sh
http://localhost:60004 admin/admin
http://localhost:60020
```
#### beatrak build
```sh
$ cd ansible/beatrak-centos7
$ make prereq
$ cd ../..
```
#### set EXT_SVC_IP in Makefile
```sh
$ ifconfig -a # example
...
enp0s3: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
...
$ sed -i "s/EXT_SVC_IP :=/EXT_SVC_IP := 10.0.2.15/g" ./Makefile
$
$ make build-all
$ make installgen
$ make create-all
$ make postgresql-gen
$ kubectl get pods -o wide
$ kubectl get svc -o wide
$
$ make beacon-config-default                                 # scenario 1
$ make beacon-config-skew                                    # scenario 2
$ kubectl scale statefulsets beacon-za-ss-hlsvc --replicas=3 # scenario 3
$ make beacon-config-zonetocluser                            # scenario 4
$ make beacon-create-zb                                      # scenario 5
$
$ kubectl get pods -o wide
$ kubectl get svc -o wide
$
$ make delete-all
```
## build
* [Building Beatrak from scratch](https://github.com/ciscosystems/beatrak/blob/master/docs/BUILD.md)
## storyboard
* [Demo storyboard commands and expected results](https://github.com/ciscosystems/beatrak/blob/master/docs/STORYBOARD.md)
## utils
* [Commands to build and create all, as well as reset](https://github.com/ciscosystems/beatrak/blob/master/docs/UTILS.md)
