## scenario 1
#### ```make beacon-config-default```

* beacon_za_brussels ->
  * stage-cla ~50%
  * stage-clb ~50%

## scenario 2
#### ```make beacon-config-skew```
* beacon_za_brussels ->
  * stage-cla ~30%
  * stage-clb ~70%

## scenario 3
#### ```kubectl scale statefulsets beacon-za-ss-hlsvc --replicas=3```
* beacon_za_brussels ->
  * stage-cla ~17%
  * stage-clb ~17%
* beacon_za_amsterdam ->
  * stage-cla ~17%
  * stage-clb ~17%
* beacon_za_paris ->
  * stage-cla ~17%
  * stage-clb ~17%

## scenario 4
#### ```make beacon-config-zonetocluser```
* beacon_za_brussels ->
  * stage-cla ~33%
* beacon_za_amsterdam ->
  * stage-cla ~33%
* beacon_za_paris ->
  * stage-cla ~33%

## scenario 5 {3b(za)~>cla; cla:clb->100:100}, {1b(zb)~>cla|clb; cla:clb->50:50}}
#### ```make beacon-create-zb```
* beacon_za_brussels ->
  * stage-cla ~33%
* beacon_za_amsterdam ->
  * stage-cla ~33%
* beacon_za_paris ->
  * stage-cla ~33%

```
make build-all
make create-all

kubectl get pods -o wide
make create-all
kubectl get pods -o wide

make beacon-config-default                                 # step 1
make beacon-config-skew                                    # step 2
kubectl scale statefulsets beacon-za-ss-hlsvc --replicas=3 # step 3
make beacon-config-zonetocluser                            # step 4
make beacon-create-zb                                      # step 5

make delete-all
```
