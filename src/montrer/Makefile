export SERVICE_NAME=montrer-envoy-dep-svc
export APP=${SERVICE_NAME}

env:
ifndef ROOT_SRC_DIR
	$(eval ROOT_SRC_DIR=$(abspath ${PWD}/..))
	@echo "ROOT_SRC_DIR="${ROOT_SRC_DIR}
endif
	$(eval export NODE_PATH=/usr/lib/node_modules)
ifndef TARGET
TARGET = devshell
endif

banner: 
	@echo "----------------------------------------"
	@echo "-"
	@echo "-"
	@echo "-"
	@echo "- TARGET = "${TARGET}
	@echo "-"
	@echo "- targets: devshell"
	@echo "-          prod"
	@echo "-          montrer (prod)"
	@echo "- ex.: $$ TARGET=prod make build"
	@echo "-      $$ TARGET=devshell make create"
	@echo "-      $$ TARGET=montrer make delete"
	@echo "-"
	@echo "-"
	@echo "-"
	@echo "----------------------------------------"

#
# TOP
#
build: env banner k8s-build-$(TARGET)
create: env banner k8s-create-$(TARGET)
delete: env banner k8s-delete-$(TARGET)
shell: env banner k8s-shell-$(TARGET)
shell-envoy: banner k8s-shell-envoy-${TARGET}

#
# MONTRER-ENVOY
#
# NOTE: this is an external "ingress"
#	envoy because we need to proxy it to the
#	outside, and it has a hlsvc backend
#	for scaling unline grafana,
#	which is a regular deployment
k8s-build-envoy:
	$(MAKE) -C ./montrer-envoy k8s-build

k8s-installgen: env
k8s-installgen: NODE=${HOSTNAME}
k8s-installgen: REPLICAS=1
k8s-installgen:
	${ROOT_SRC_DIR}/tools/templ.js --templ=${SERVICE_NAME}.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "app" : "${APP}", "replicas" : "${REPLICAS}", "extSvcNodePort": "${EXT_SVC_NODEPORT}", "extSvcExtIP": "${EXT_SVC_IP}" }' --file=${SERVICE_NAME}.yaml

k8s-create-envoy:
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-envoy: SERVICE_NAME=montrer-envoy-dep-svc
k8s-delete-envoy:
	kubectl delete -f ./${SERVICE_NAME}.yaml

#
# PROD
#
k8s-build-prod:
	mkdir -p ./montrer-svc/common/
	cp -rf ../common/* ./montrer-svc/common/
	$(MAKE) -C ./montrer-svc k8s-build

k8s-create-prod: env 
k8s-create-prod: LOG_LEVEL=error
k8s-create-prod: SERVICE_NAME=montrer-ss-hlsvc
k8s-create-prod: APP=${SERVICE_NAME}
k8s-create-prod: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=${SERVICE_NAME}.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "app" : "${APP}", "zone" : "${ZONE}", "cluster" : "$(CLUSTER)", "log-level" : "$(LOG_LEVEL)", "replicas" : "${REPLICAS}", "hostname" : "${NODE}", "app-volume-path" : "${APP_VOLUME_PATH}", "common-volume-path" : "${COMMON_VOLUME_PATH}" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-prod: SERVICE_NAME=montrer-ss-hlsvc
k8s-delete-prod:
	kubectl delete -f ./${SERVICE_NAME}.yaml

#
# DEVSHELL
#
k8s-build-devshell:
	$(MAKE) -C ./montrer-svc k8s-build-devshell

k8s-create-devshell: env 
k8s-create-devshell: NODE=${HOSTNAME}
k8s-create-devshell: REPLICAS=1
k8s-create-devshell: LOG_LEVEL=debug
k8s-create-devshell: SERVICE_NAME=montrer-devshell-ss-hlsvc
k8s-create-devshell: APP=${SERVICE_NAME}
k8s-create-devshell: APP_VOLUME_PATH=${ROOT_SRC_DIR}/montrer/montrer-svc/app
k8s-create-devshell: COMMON_VOLUME_PATH=${ROOT_SRC_DIR}/common
k8s-create-devshell: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=${SERVICE_NAME}.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "app" : "${APP}", "zone" : "${ZONE}", "cluster" : "$(CLUSTER)", "log-level" : "$(LOG_LEVEL)", "replicas" : "${REPLICAS}", "hostname" : "${NODE}", "app-volume-path" : "${APP_VOLUME_PATH}", "common-volume-path" : "${COMMON_VOLUME_PATH}" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-devshell: SERVICE_NAME=montrer-devshell-ss-hlsvc
k8s-delete-devshell:
	kubectl delete -f ${SERVICE_NAME}.yaml

# run /start-dev.sh
# (trace/debug/info/warn/error
# this ENV will overwrite env that was set
# during pod create

k8s-shell-devshell: SERVICE_NAME=montrer-devshell-ss-hlsvc
k8s-shell-devshell: LOG_LEVEL=debug
k8s-shell-devshell:
	kubectl exec ${SERVICE_NAME}-0 --container montrer -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) exec -l /bin/bash"

