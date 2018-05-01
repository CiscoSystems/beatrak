IMAGE_NAME="beatrak/node-base"
CONTAINER_NAME="beatrak-node-base"

build:
	docker build -t ${IMAGE_NAME} .

run-shell:
	docker run --name ${CONTAINER_NAME} -ti ${IMAGE_NAME} /bin/bash

show-images:
	@-docker images -a | grep cio || true

show-ps:
	@-docker ps -a | grep cio || true

drain:
	docker rm $$(sudo docker ps -aq --filter "name=beatrak-node-base*")

clean:
	-docker rmi -f $$(sudo docker images -aq ${IMAGE_NAME})

clean-deps:
	-docker rmi -f $$(docker inspect --format='{{.Id}} {{.Parent}}' $(docker images --filter since=b90a54bd96be -q))

clean-dangling:
	-docker rmi -f $$(docker images -f "dangling=true" -q)


