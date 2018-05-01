build:  k8s-build
create: k8s-create-elastic-envoy-dep-hlsvc k8s-create-elastic-ss-hlsvc
delete: k8s-delete-elastic-envoy-dep-hlsvc k8s-delete-elastic-ss-hlsvc
shell: k8s-elastic-shell

k8s-build:
	$(MAKE) -C ./elastic-svc k8s-build
	$(MAKE) -C ./elastic-envoy k8s-build

# this manifest is for HEADLESS HLSVC beased on headless deployment
#
k8s-create-elastic-envoy-dep-hlsvc:
	kubectl create -f ./elastic-envoy-dep-hlsvc.yaml

k8s-delete-elastic-envoy-dep-hlsvc:
	-kubectl delete -f ./elastic-envoy-dep-hlsvc.yaml

k8s-create-elastic-ss-hlsvc-create-master-node:
	kubectl create -f ./elastic-ss-hlsvc.yaml

k8s-create-elastic-ss-hlsvc-waitfor-master-node-ip:
	@echo "wait for elastcip master node ip"
	@echo "sleep for 5s..."
	@sleep 5

k8s-create-elastic-ss-hlsvc: k8s-create-elastic-ss-hlsvc-create-master-node
k8s-create-elastic-ss-hlsvc: k8s-create-elastic-ss-hlsvc-waitfor-master-node-ip
k8s-create-elastic-ss-hlsvc: ELASTIC_IP=$(shell kubectl get pods -o wide | grep elastic-node-0 | awk '{print $$6}' | sed -e 's/\r//g')
k8s-create-elastic-ss-hlsvc:
	echo "ELASTIC_IP=${ELASTIC_IP}";
	while true; do \
		echo "wait..."; \
		sleep 2; \
		ELASTIC_UP=$$(curl -sS -XGET -i --connect-timeout 1 "http://${ELASTIC_IP}:9200/_cluster/health" | grep OK | awk '{print $$3}'| sed -e 's/[[:space:]]//g' ); \
		echo $$ELASTIC_UP; \
		if [ "$$ELASTIC_UP" = "OK" ]; then break; \
		fi; \
	done;
	@echo "wait some more for setup..."
	@echo "sleep 20s..."
	@sleep 30;
	kubectl scale statefulsets/elastic-node  --replicas=2

k8s-delete-elastic-ss-hlsvc:
	kubectl delete -f ./elastic-ss-hlsvc.yaml

k8s-elastic-shell:
	kubectl exec elastic-node-0 -i -t -- /bin/bash

k8s-installgen:
	${ROOT_SRC_DIR}/tools/templ.js --templ=elastic-ss-hlsvc.templ.yaml --data='{ "beatrak_root" : "${ROOT_SRC_DIR}", "extSvcNodePort": "${EXT_SVC_NODEPORT}", "extSvcExtIP": "${EXT_SVC_IP}" }' --file=elastic-ss-hlsvc.yaml
