IMAGE_NAME="beatrak/stage1-envoy"
#
# k8s
#

k8s-build:
	docker build --rm -t $(IMAGE_NAME) .

k8s-reload-pod: 
	-kubectl delete -f pod.yaml && sleep 30;
	$(MAKE) docker-build
	kubectl create -f pod.yaml

reconfig: k8s-reconfig-envoy
shell: k8s-shell
logs:
	kubectl logs stage1-devshell envoy

k8s-reconfig-envoy:
	kubectl cp ./envoy.new.json stage1-devshell:/envoy.new.json -c envoy
	kubectl exec stage1-devshell -c envoy -- /bin/bash -c "cp -f /envoy.json /envoy.old.json; cp -f /envoy.new.json /envoy.json;"
	kubectl exec stage1-devshell -c envoy -- /restart-envoy.sh
	kubectl logs stage1-devshell envoy

k8s-shell:
	kubectl exec stage1-devshell -c envoy -it -- /bin/bash --rcfile doesnotmatter
