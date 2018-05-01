IMAGE_NAME="beatrak/elasticsearch"
CONTAINER_NAME="beatrak-elasticsearch"

CLUSTER_SVC_API_PORT=59200
CLUSTER_SVC_TRANSPORT_PORT=59300

drain:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

k8s-create-pod: k8s-delete-pod
	kubectl create -f pod.yml

k8s-delete-pod:
	-kubectl delete -f pod.yml
	sleep 7

k8s-cluster-ip:
	$(eval CLUSTER_IP=$(shell kubectl get pods -o wide | grep elastic-node-0 | awk '{print $$6}' | sed -e 's/\r//g'))

k8s-test-pod: k8s-cluster-ip
	curl ${CLUSTER_IP}:9200

k8s-test-svc-headfull: k8s-cluster-ip
	curl ${CLUSTER_IP}:$(CLUSTER_SVC_API_PORT)

k8s-test-elastic-health: k8s-cluster-ip
	curl -XGET http://${CLUSTER_IP}:9200/_cluster/health?pretty

k8s-shell:
	kubectl exec $(CONTAINER_NAME) -i -t -- /bin/bash

k8s-put-pod: k8s-cluster-ip
	curl -XPUT http://${CLUSTER_IP}:9200/estest/test/1 \
		-d '{"name" : "Elasticsearch Test", "Description": "This is just a test" }'

k8s-search-pod: k8s-cluster-ip
	curl -XGET "${CLUSTER_IP}:9200/estest/_search?format=yaml" \
		-H 'Content-Type: application/json' \
		-d '{"query": { "match": { "name": "Test" } } }'

k8s-put-svc: k8s-cluster-ip
	curl -XPUT http://${CLUSTER_IP}:$(CLUSTER_SVC_API_PORT)/estest/test/1 \
		-d '{"name" : "Elasticsearch Test", "Description": "This is just a test" }'

k8s-search-svc: k8s-cluster-ip
	curl -XGET '${CLUSTER_IP}:$(CLUSTER_SVC_API_PORT)/estest/_search?format=yaml' \
		-H 'Content-Type: application/json' \
		-d '{"query": { "match": { "name": "Test" } } }'

k8s-build:
	docker build --rm -t $(IMAGE_NAME) .

k8s-create-svc:
	kubectl create -f elastic-svc.yaml

k8s-delete-svc:
	kubectl delete -f elastic-svc.yaml




