IMAGE_NAME="beatrak/beacon-envoy"
CONTAINER_NAME="beacon-envoy"
#
# k8s
#

k8s-build:
	docker build --rm -t $(IMAGE_NAME) .

k8s-create-pod: 
	kubectl create -f pod.yaml

k8s-delete-pod:
	kubectl delete -f pod.yaml

k8s-reload-pod: 
	-kubectl delete -f pod.yaml && sleep 30;
	$(MAKE) docker-build
	kubectl create -f pod.yaml

k8s-reconfig-envoy-old:
	kubectl cp envoy.json.new $(CONTAINER_NAME):/
	kubectl exec $(CONTAINER_NAME) -- /bin/bash -c "cp -f /envoy.json /envoy.json.old; cp -f /envoy.json.new /envoy.json;"
	kubectl exec $(CONTAINER_NAME) -- /restart-envoy.sh

k8s-shell:
	kubectl exec $(CONTAINER_NAME) -it -- /bin/bash --rcfile doesnotmatter

k8s-log:
	kubectl log $(CONTAINER_NAME)


reconfig: k8s-reconfig-envoy

k8s-reconfig-envoy: POD_NAME=beacon-devshell
k8s-reconfig-envoy:
	kubectl cp ./envoy.new.json $(POD_NAME):/envoy.new.json -c envoy
	kubectl exec $(POD_NAME) -c envoy -- /bin/bash -c "cp -f /envoy.json /envoy.old.json; cp -f /envoy.new.json /envoy.json;"
	kubectl exec $(POD_NAME) -c envoy -- /restart-envoy.sh




