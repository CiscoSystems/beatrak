# PROD
IMAGE_NAME=beatrak/beacon
IMAGE_DEVSHELL_NAME=beatrak/beacon-devshell
CONTAINER_NAME="beatrak-beacon"

ESCAPED_PWD=$(shell echo $(PWD) | sed 's_/_\\/_g')


#
# DEVSHELL
#
k8s-build-devshell:
	sudo docker build --file Dockerfile-k8s-devshell --rm -t "$(IMAGE_DEVSHELL_NAME)" .

#
# PROD
#
k8s-build:
	sudo docker build --file Dockerfile --rm -t "${IMAGE_NAME}" .

#
# DOCKER targets 
#

docker-build:
	sudo docker build --rm -t ${IMAGE_NAME} .

docker-build-dev:
	sudo docker build --file Dockerfile-docker-dev --rm -t ${IMAGE_NAME_DEV} .

docker-run-shell: docker-drain
	sudo docker run -p ${EXTERNAL_PORT}:8080 --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} /bin/bash

docker-run-shell-dev: docker-drain
	sudo docker run --volume ${PWD}/app:/root/app -p ${EXTERNAL_PORT_DEV}:8080 --name ${CONTAINER_NAME_DEV}-dev -ti ${IMAGE_NAME_DEV} /bin/bash

# copies the source code, good for production
docker-run: docker-drain docker-build
	sudo docker run --rm -p ${EXTERNAL_PORT}:8080 --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} 

# mounts the local drive so that we can edit the source code live
docker-run-dev: docker-drain docker-build-dev
	sudo docker run --rm --volume ${PWD}/app:/root/app -p ${EXTERNAL_PORT_DEV}:8080 --name ${CONTAINER_NAME_DEV}-dev -ti ${IMAGE_NAME_DEV} 

docker-rund: docker-drain
	sudo docker run -d -p ${EXTERNAL_PORT}:8080 --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} > .docker_id

docker-shell:
	sudo docker exec -it `cat .docker_id` /bin/bash

docker-logs:
	sudo docker logs `cat .docker_id`

docker-show-images:
	@-sudo docker images -a | grep cio || true

docker-show-ps:
	@-sudo docker ps -a | grep cio || true

docker-drain:
	-sudo docker stop $$(sudo docker ps -aq --filter "name=cio*")
	-sudo docker rm $$(sudo docker ps -aq --filter "name=cio*")

drain-exit:
	sudo docker rm $$(sudo docker ps -aq --filter "status=exited")

docker-cleanall:
	sudo docker rmi $$(sudo docker images -aq --filter "dangling=true")

docker-clean:
	-sudo docker rmi -f $$(sudo docker images -aq ${IMAGE_NAME})

docker-clean-dev:
	-sudo docker rmi -f $$(sudo docker images -aq ${IMAGE_NAME_DEV})

docker-clean-deps:
	docker inspect --format='{{.Id}} {{.Parent}}' $(docker images --filter since=b90a54bd96be -q)





