build:
	docker build -t alpine-node .

run-shell:
	docker run -it alpine-node /bin/sh

drain:
	-docker stop $$(sudo docker ps -aq --filter "name=alpine-node*")
	-docker rm $$(sudo docker ps -aq --filter "name=alpine-node*")
clean:
	-docker rmi -f $$(sudo docker images -aq alpine-node)




