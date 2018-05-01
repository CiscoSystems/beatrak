# PROD
IMAGE_NAME=beatrak/locpick
IMAGE_DEVSHELL_NAME=beatrak/locpick-devshell

ESCAPED_PWD=$(shell echo $(PWD) | sed 's_/_\\/_g')

#
# DEVSHELL
#
k8s-build-devshell:
	sudo docker build --file Dockerfile-k8s-devshell --rm -t "$(IMAGE_DEVSHELL_NAME)" .

#
# PROD
k8s-build:
	sudo docker build --file=Dockerfile --rm -t "${IMAGE_NAME}" .
