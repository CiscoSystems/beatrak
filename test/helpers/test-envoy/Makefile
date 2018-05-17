IMAGE_NAME="beatrak/test-envoy"
CONTAINER_NAME="test-envoy"
LISTENER_PORT=50001
API_PORT=50011

all: docker-build

#
# docker
#
docker-build:
	sudo docker build --rm -t $(IMAGE_NAME) .

docker-cleanup:
	sudo docker rmi lyft/envoy

docker-rund: docker-drain
	cp -rf ${PWD}/../../beaplane/envoy-configs/* ./envoy-configs
	sudo docker run --rm --volume ${PWD}/envoy-configs:/envoy-configs -d -p ${API_PORT}:${API_PORT} -p ${LISTENER_PORT}:${LISTENER_PORT} --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} > .docker_id

docker-shell:
	sudo docker exec -it $$(cat .docker_id) /bin/bash

docker-drain:
	-@sudo docker stop $$(sudo docker ps -aq --filter "name=test-envoy*") &> /dev/null
	-@sudo docker rm $$(sudo docker ps -aq --filter "name=test-envoy*") &> /dev/null

#
# k8s
#
k8s-build:
	docker build --rm -t $(IMAGE_NAME) .


