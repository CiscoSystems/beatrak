# DEVSHELL
IMAGE_DEVSHELL_NAME="beatrak/montrer-devshell"
CONTAINER_DEVSHELL_NAME="beatrak-montrer-devshell"

# PROD
IMAGE_NAME="beatrak/montrer"
CONTAINER_NAME="beatrak-montrer"

ESCAPED_PWD=$(shell echo $(PWD) | sed 's_/_\\/_g')

#
# DEVSHELL
#
k8s-build-devshell:
	sudo docker build --file Dockerfile-k8s-devshell --rm -t "$(IMAGE_DEVSHELL_NAME)" .

#
# PROD
#
# yarn install here
# yarn install in react-ui
# afterwards all of this stuff
k8s-build-original:
	sudo docker build --file Dockerfile --rm -t "$(IMAGE_NAME)" .

k8s-build:
	cd app; yarn install
	cd app/react-ui; yarn install
	docker build --file Dockerfile --rm -t "$(IMAGE_NAME)" .
