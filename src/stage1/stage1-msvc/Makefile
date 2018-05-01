# DEVSHELL
IMAGE_DEVSHELL_NAME="beatrak/stage1-devshell"
CONTAINER_DEVSHELL_NAME="beatrak-stage1-devshell"

# STAGE1
IMAGE_NAME="beatrak/stage1"
CONTAINER_NAME="beatrak-stage1"

ESCAPED_PWD=$(shell echo $(PWD) | sed 's_/_\\/_g')

#
# DEVSHELL
#
k8s-build-devshell:
	sudo docker build --file Dockerfile-k8s-devshell --rm -t "$(IMAGE_DEVSHELL_NAME)" .

#
# STAGE1
#
k8s-build:
	sudo docker build --file Dockerfile --rm -t "$(IMAGE_NAME)" .
