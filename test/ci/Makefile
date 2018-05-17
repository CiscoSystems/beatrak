#
# make docker-rund-devshell 
# make docker-devshell 
# docker logs -f $(cat .docker_id)
#

IMAGE_NAME="beatrak/test-ci"
CONTAINER_NAME="test-ci"
LISTENER_PORT=50001
API_PORT=50011

all: docker-build

#
# docker
#
docker-build:
	sudo docker build --rm -t $(IMAGE_NAME) .

docker-build-devshell:
	sudo docker build --no-cache --rm -t $(IMAGE_NAME)-devshell --file Dockerfile-docker-devshell .

docker-cleanup:
	sudo docker rmi envoyproxy/envoy

docker-rund: docker-drain docker-build
	cp -rf ${PWD}/../../beaplane/envoy-configs/* ./envoy-configs
	sudo docker run --rm --volume ${PWD}/envoy-configs:/envoy-configs -d -p ${API_PORT}:${API_PORT} -p ${LISTENER_PORT}:${LISTENER_PORT} --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} > .docker_id

docker-rund-devshell: docker-drain
#	cp -rf ${PWD}/../../beaplane/envoy-configs/* ./envoy-configs
	sudo docker run --rm --volume ${PWD}/../../:/beatrak -d -p ${API_PORT}:${API_PORT} -p ${LISTENER_PORT}:${LISTENER_PORT} --name ${CONTAINER_NAME}-devshell -ti ${IMAGE_NAME}-devshell > .docker_devshell_id


docker-shell:
	sudo docker exec -it $$(cat .docker_id) /bin/bash 

docker-devshell:
	sudo docker exec -it $$(cat .docker_devshell_id) /bin/bash -c "echo \"export PS1='[beatrak/test-ci-devshell]# '\" >~/.bashrc; export TERM=dumb; /bin/bash"

docker-drain:
	-@sudo docker stop $$(sudo docker ps -aq --filter "name=test-ci*") &> /dev/null
	-@sudo docker rm $$(sudo docker ps -aq --filter "name=test-ci*") &> /dev/null

#
# k8s
#
k8s-build:
	docker build --rm -t $(IMAGE_NAME) .


