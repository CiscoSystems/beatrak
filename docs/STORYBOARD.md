# beatrak storyboard

*NOTE: The following was deployed after `make installgen EXT_SVC_IP=10.138.0.3`*

```sh
$ make elastic-create
...
wait...
OK
wait some more for setup...
sleep 20s...
kubectl scale statefulsets/elastic-node  --replicas=2
statefulset "elastic-node" scaled
$ kubectl get pods -o wide
NAME                                      READY     STATUS    RESTARTS   AGE       IP           NODE
elastic-envoy-dep-hlsvc-c9b886b85-zb9f2   1/1       Running   0          1m        10.32.0.9    k8s-kubeadm-node-01
elastic-node-0                            1/1       Running   0          1m        10.32.0.10   k8s-kubeadm-node-01
elastic-node-1                            1/1       Running   0          57s       10.32.0.11   k8s-kubeadm-node-01
# TODO: remove valid ExternalIP for postgresql-svc
$ make postgresql-create
$ kubectl get pods -o wide
NAME                                      READY     STATUS    RESTARTS   AGE       IP           NODE
elastic-envoy-dep-hlsvc-c9b886b85-zb9f2   1/1       Running   0          4m        10.32.0.9    k8s-kubeadm-node-01
elastic-node-0                            1/1       Running   0          4m        10.32.0.10   k8s-kubeadm-node-01
elastic-node-1                            1/1       Running   0          3m        10.32.0.11   k8s-kubeadm-node-01
postgresql-dep-svc-795bd78b5d-6pmzt       1/1       Running   0          8s        10.32.0.12   k8s-kubeadm-node-01
$ make postgresql-gen
...
psql --username=postgres --host=10.99.149.235 --port=50005 --command="\d+"
                          List of relations
 Schema |     Name      | Type  |  Owner   |    Size    | Description 
--------+---------------+-------+----------+------------+-------------
 public | stage1_init   | table | postgres | 8192 bytes | 
 public | stage1_signal | table | postgres | 16 kB      | 
(2 rows)
$ make grafana-create
$ ifconfig eth0
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1460
        inet 10.138.0.3  netmask 255.255.255.255  broadcast 10.138.0.3
...
# Change ExternalIP for grafana to the one on eth0
$ kubectl get pods -o wide
NAME                                      READY     STATUS    RESTARTS   AGE       IP           NODE
elastic-envoy-dep-hlsvc-c9b886b85-zb9f2   1/1       Running   0          6m        10.32.0.9    k8s-kubeadm-node-01
elastic-node-0                            1/1       Running   0          6m        10.32.0.10   k8s-kubeadm-node-01
elastic-node-1                            1/1       Running   0          5m        10.32.0.11   k8s-kubeadm-node-01
grafana-dep-svc-74fd67d49f-9qvn7          1/1       Running   0          11s       10.32.0.13   k8s-kubeadm-node-01
postgresql-dep-svc-795bd78b5d-6pmzt       1/1       Running   0          2m        10.32.0.12   k8s-kubeadm-node-01
$ kubectl get svc -o wide
NAME                      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE       SELECTOR
elastic-envoy-dep-hlsvc   ClusterIP   None            <none>        9200/TCP,50011/TCP   6m        app=elastic-envoy
elastic-ss-hlsvc          ClusterIP   None            <none>        9200/TCP,9300/TCP    6m        app=elastic
grafana-dep-svc           ClusterIP   10.99.149.233   10.138.0.3    50004/TCP            43s       app=grafana
kubernetes                ClusterIP   10.96.0.1       <none>        443/TCP              21d       <none>
postgresql-dep-svc        ClusterIP   10.99.149.235   10.138.0.3   50005/TCP            2m        app=postgresql-dep-svc
# graphana should be accessible on exteranl linked to 10.138.0.3, ex.: http://x.x.x.x:50004/ (admin/admin)
$ make locpick-create
$ kubectl get pods -o wide | grep locpick
locpick-dep-hlsvc-566d44b6-h958g          2/2       Running   0          16s       10.32.0.14   k8s-kubeadm-node-01
#
# BEACONS
#
$ make beacon-create-za
$ kubectl get pods -o wide | grep beacon
beacon-za-ss-hlsvc-0                      2/2       Running   0          21s       10.32.0.15   k8s-kubeadm-node-01
# STORYBOARD: 1 beacon in brussels on grafana dashboard
#
# STAGE1
#
# STAGE-CLA
$ make stage1-create-cla
# STORYBOARD: The default config is 50:50 cla:clb
# 	       if there is no clb, we don't automatically
# 	       get redirected to cla only, getting no healthy upstream
# 	       but sometimes traffic switches back to cla
#	       There is some traffic on stage1-cla-count in grafana
# 
# STAGE-CLB
$ make stage1-create-clb
# STORYBOARD: Traffic is on CLA and CLB at 50:50
# 	       Wait for 30sec for numbers to stabilize
$ kubectl get pods -o wide
NAME                                      READY     STATUS    RESTARTS   AGE       IP           NODE
beacon-za-ss-hlsvc-0                      2/2       Running   0          6m        10.32.0.15   k8s-kubeadm-node-01
elastic-envoy-dep-hlsvc-c9b886b85-zb9f2   1/1       Running   0          1h        10.32.0.9    k8s-kubeadm-node-01
elastic-node-0                            1/1       Running   0          1h        10.32.0.10   k8s-kubeadm-node-01
elastic-node-1                            1/1       Running   0          1h        10.32.0.11   k8s-kubeadm-node-01
grafana-dep-svc-74fd67d49f-9qvn7          1/1       Running   0          55m       10.32.0.13   k8s-kubeadm-node-01
locpick-dep-hlsvc-566d44b6-lwzh8          2/2       Running   0          44m       10.32.0.14   k8s-kubeadm-node-01
postgresql-dep-svc-795bd78b5d-6pmzt       1/1       Running   0          57m       10.32.0.12   k8s-kubeadm-node-01
stage1-cla-ss-hlsvc-0                     2/2       Running   0          2m        10.32.0.16   k8s-kubeadm-node-01
stage1-clb-ss-hlsvc-0                     2/2       Running   0          2m        10.32.0.17   k8s-kubeadm-node-01
$ make montrer-envoy-create
$ make montrer-create
$ kubectl get pods -o wide | grep montrer
montrer-envoy-dep-svc-7bccf944d4-gn4cj    1/1       Running   0          1m        10.32.0.18   k8s-kubeadm-node-01
montrer-ss-hlsvc-0                        1/1       Running   0          33s       10.32.0.19   k8s-kubeadm-node-01
$ kubectl get svc -o wide | grep montrer
montrer-envoy-dep-svc     ClusterIP   10.99.149.200   10.138.0.3    50020/TCP,55020/TCP,50011/TCP   1m        app=montrer-envoy-dep-svc
montrer-ss-hlsvc          ClusterIP   None            <none>        50010/TCP,50020/TCP,50011/TCP   43s       app=montrer-ss-hlsvc
# STORYBOARD: Montrer UI should be on the same ip as graphane at http://x.x.x.x:50020/
#
# TRAFFIC SHAPING
#
# STORYBOARD:
#	GOAL: dfault config after steps above, ~50:50 between CLA and CLB clusters (envoy.json):
#	...
#     			    "routes": [{
#				"timeout_ms": 0,
#				"prefix": "/",
#				"weighted_clusters": {
#				    "clusters" : [
#					{
#					    "name" : "stage1-cla",
#					    "weight": 50
#					},
#					{
#					    "name" : "stage1-clb",
#					    "weight" : 50
#					}
#				    ]}
#			    }]
#       ...
#	RESULT: 
#	brussels, za, cla, sps=2, 53%
# 	burssels, za, clb, sps=2, 47%
$ kubectl scale statefulsets beacon-za-ss-hlsvc --replicas=3
# STORYBOARD:
#	wait 1 minute
#	RESULT:
#	amsterdam, za, cla, sps=2, 15%
#	amsterdam, za, clb, sps=2, 17%
#	brussels,  za, cla, sps=2, 16%
#	brussels,  za, clb, sps=2, 17%
#	paris,     za, cla, sps=2, 18%
#	paris,     za, clb, sps=2, 17%
$ make beacon-config-default
# STORYBOARD:
#	GOAL: same "default" traffic as before scaling
#	RESULT:
# 	same traffic as above
$ make beacon-config-skew
# STORYBOARD:
#	GOAL: skew the traffic 30/70 between clusters
#	...
#			    "routes": [{
#				"timeout_ms": 0,
#				"prefix": "/",
#				"weighted_clusters": {
#				    "clusters" : [
#					{
#					    "name" : "stage1-cla",
#					    "weight": 30
#					},
#					{
#					    "name" : "stage1-clb",
#					    "weight" : 70
#					}
#				    ]}
#			    }]
#	...			    
#	wait 1 minute
#	RESULT:
#	amsterdam, za, cla, sps=1, 11%
#	amsterdam, za, clb, sps=3, 23%
#	brussels,  za, cla, sps=1, 9%
#	brussels,  za, clb, sps=3, 25%
#	paris,     za, cla, sps=1, 10%
#	paris,     za, clb, sps=3, 22%
$ make beacon-config-zonetocluser
# STORYBOARD:
#	GOAL: send all the za traffic through cla cluster
#	...
#	    "routes": [{
#				"timeout_ms": 0,
#				"prefix": "/za",
#				"weighted_clusters": {
#				    "clusters" : [
#					{
#					    "name" : "stage1-cla",
#					    "weight": 100
#					},
#					{
#					    "name" : "stage1-clb",
#					    "weight" : 0
#					}
#				    ]}
#			    },
#			    {
#				"timeout_ms": 0,
#				"prefix": "/zb",
#				"weighted_clusters": {
#				    "clusters" : [
#					{
#					    "name" : "stage1-cla",
#					    "weight": 0
#					},
#					{
#					    "name" : "stage1-clb",
#					    "weight" : 100
#					}
#				    ]}
#			    }
#		           ]
#       ...
#	wait 1 minute
#	amsterdam, za, cla, sps=4, 33%
#	brussels,  za, cla, sps=4, 33%
#	paris,     za, clb, sps=4, 33%
$ make beacon-create-zb
# STORYBOARD:
#	GOAL: launch a beacon in ZB zone
# 	config is old envoy-default.json, with cla:clb <- 50:50
#	this is because it has not
#	been dynamically reconfigured yet
#	wait 1 minute
#	RESULT:
#	amsterdam, za, cla, sps=4, 25%
#	brussels,  za, cla, sps=4, 25%
#	paris,     za, clb, sps=4, 25%
#	sf,        zb, cla, sps=2, 13%
#	sf,        zb, clb, sps=2, 12%
$ make beacon-config-zonetocluser
# STORYBOARD:
#	GOAL: reconfigure so that all zb traffic goes to clb
#	...
#	    "routes": [{
#		"timeout_ms": 0,
#		"prefix": "/za",
#		"weighted_clusters": {
#		    "clusters" : [
#			{
#			    "name" : "stage1-cla",
#			    "weight": 100
#			},
#			{
#			    "name" : "stage1-clb",
#			    "weight" : 0
#			}
#		    ]}
#	    },
#	    {
#		"timeout_ms": 0,
#		"prefix": "/zb",
#		"weighted_clusters": {
#		    "clusters" : [
#			{
#			    "name" : "stage1-cla",
#			    "weight": 0
#			},
#			{
#			    "name" : "stage1-clb",
#			    "weight" : 100
#			}
#		    ]}
#	    }
#           ]
#	}]
#	...
#	RESULT:
#	amsterdam, za, cla, sps=4, 25%
#	brussels,  za, cla, sps=4, 25%
#	paris,     za, cla, sps=4, 25%
#	sf,        zb, clb, sps=4, 25%
#
# UTILS
#
# bring down beacons that're writing to elastic
$ make beacon-delete-za
# bring down elasti
$ make elastic-delete
$ make elastic-create
# flow starts
# reset: change the IP values in the makefile
# 	  do it couple of times
$ make elastic-reset
# reset locpicks before re-starting the storyboard
# locpick-reset 
$ make locpick-reset
```
