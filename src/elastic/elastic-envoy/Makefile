#
# make docker-build
# make k8s-create-pod
#
IMAGE_NAME="beatrak/elastic-envoy"
CONTAINER_NAME="elastic-envoy"
EXTERNAL_PORT=55555
EXTERNAL_ADMIN_PORT=55556

docker-drain:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

docker-build:
	docker build --rm -t $(IMAGE_NAME) .

docker-run: docker-drain docker-build
	docker run -d \
		-p $(EXTERNAL_PORT):10000 \
		-p $(EXTERNAL_ADMIN_PORT):9901 \
		--name $(CONTAINER_NAME) -t $(IMAGE_NAME)

docker-run-shell: docker-drain docker-build
	sudo docker run \
		-p ${EXTERNAL_PORT}:10000 \
		-p $(EXTERNAL_ADMIN_PORT):9901 \
		--name ${CONTAINER_NAME} -ti ${IMAGE_NAME} \
		 /bin/bash
docker-test:
	curl -sS localhost:$(EXTERNAL_PORT)
	curl -sS localhost:$(EXTERNAL_ADMIN_PORT)/stats | grep upstream_rq_total

docker-shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

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

k8s-reconfig-envoy:
	kubectl cp envoy.json.new $(CONTAINER_NAME):/
	kubectl exec $(CONTAINER_NAME) -- /bin/bash -c "cp -f /envoy.json /envoy.json.old; cp -f /envoy.json.new /envoy.json;"
	kubectl exec $(CONTAINER_NAME) -- /restart-envoy.sh

k8s-shell:
	kubectl exec $(CONTAINER_NAME) -it -- /bin/bash --rcfile doesnotmatter

k8s-log:
	kubectl log $(CONTAINER_NAME)
