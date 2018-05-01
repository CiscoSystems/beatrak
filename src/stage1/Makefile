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
	@echo "-          stage1-cla (prod)"
	@echo "-          stage1-clb (prod)"
	@echo "- ex.: $$ TARGET=prod make build"
	@echo "-      $$ TARGET=devshell make create"
	@echo "-      $$ TARGET=stage1-cla make delete"
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
# PROD
#
k8s-build-prod:
	mkdir -p ./stage1-msvc/common/
	cp -rf ../common/* ./stage1-msvc/common/
	$(MAKE) -C ./stage1-msvc k8s-build
	$(MAKE) -C ./stage1-envoy k8s-build

#
# DEVSHELL
#
k8s-build-devshell:
	$(MAKE) -C ./stage1-msvc k8s-build-devshell
	$(MAKE) -C ./stage1-envoy k8s-build

k8s-create-devshell: env 
k8s-create-devshell: NODE=${HOSTNAME}
k8s-create-devshell: REPLICAS=1
k8s-create-devshell: LOG_LEVEL=debug
k8s-create-devshell: SERVICE_NAME=stage1-devshell-ss-hlsvc
k8s-create-devshell: APP=${SERVICE_NAME}
k8s-create-devshell: ZONE=zdevshell
k8s-create-devshell: CLUSTER=cla
k8s-create-devshell: APP_VOLUME_PATH=${ROOT_SRC_DIR}/stage1/stage1-msvc/app
k8s-create-devshell: COMMON_VOLUME_PATH=${ROOT_SRC_DIR}/common
k8s-create-devshell: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=${SERVICE_NAME}.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "app" : "${APP}", "zone" : "${ZONE}", "cluster" : "$(CLUSTER)", "log-level" : "$(LOG_LEVEL)", "replicas" : "${REPLICAS}", "hostname" : "${NODE}", "app-volume-path" : "${APP_VOLUME_PATH}", "common-volume-path" : "${COMMON_VOLUME_PATH}" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-devshell: SERVICE_NAME=stage1-devshell-ss-hlsvc
k8s-delete-devshell:
	kubectl delete -f ${SERVICE_NAME}.yaml

# run /start-dev.sh
# (trace/debug/info/warn/error
# this ENV will overwrite env that was set
# during pod create

k8s-shell-devshell: SERVICE_NAME=stage1-devshell-ss-hlsvc
k8s-shell-devshell: LOG_LEVEL=debug
k8s-shell-devshell: ZONE=zdevshell
k8s-shell-devshell: CLUSTER=clstage1-devshell
k8s-shell-devshell:
	kubectl exec ${SERVICE_NAME}-0 --container stage1 -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) CLUSTER=$(CLUSTER) ZONE=$(ZONE) exec -l /bin/bash"


#
# STAGE1-CLA
#
k8s-build-stage1-cla:
	mkdir -p ./stage1-msvc/common/
	cp -rf ../common/* ./stage1-msvc/common/
	$(MAKE) -C ./stage1-msvc k8s-build
	$(MAKE) -C ./stage1-envoy k8s-build


k8s-create-stage1-cla: env
k8s-create-stage1-cla: SERVICE_NAME=stage1-cla-ss-hlsvc
k8s-create-stage1-cla: APP=${SERVICE_NAME}
k8s-create-stage1-cla: REPLICAS=1
k8s-create-stage1-cla: LOG_LEVEL=error
k8s-create-stage1-cla: CLUSTER=cla
k8s-create-stage1-cla: ZONE=nozone
k8s-create-stage1-cla: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=stage1-ss-hlsvc.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "cluster" : "$(CLUSTER)", "zone" : "$(ZONE)", "replicas" : "$(REPLICAS)", "log-level" : "$(LOG_LEVEL)", "app" : "${APP}", "hostname" : "$(HOSTNAME)"}' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-stage1-cla: SERVICE_NAME=stage1-cla-ss-hlsvc
k8s-delete-stage1-cla:
	kubectl delete -f ${SERVICE_NAME}.yaml

k8s-shell-stage1-cla: SERVICE_NAME=stage1-cla-ss-hlsvc
k8s-shell-stage1-cla: LOG_LEVEL=debug
k8s-shell-stage1-cla:
	kubectl exec ${SERVICE_NAME}-0 --container stage1 -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) exec -l /bin/bash"


#
# STAGE1-CLB
#
k8s-build-stage1-clb:
	mkdir -p ./stage1-msvc/common/
	cp -rf ../common/* ./stage1-msvc/common/
	$(MAKE) -C ./stage1-msvc k8s-build
	$(MAKE) -C ./stage1-envoy k8s-build

k8s-create-stage1-clb: env
k8s-create-stage1-clb: SERVICE_NAME=stage1-clb-ss-hlsvc
k8s-create-stage1-clb: APP=${SERVICE_NAME}
k8s-create-stage1-clb: REPLICAS=1
k8s-create-stage1-clb: LOG_LEVEL=error
k8s-create-stage1-clb: CLUSTER=clb
k8s-create-stage1-clb: ZONE=nozone
k8s-create-stage1-clb: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=stage1-ss-hlsvc.templ.yaml --data='{ "service-name" : "$(SERVICE_NAME)", "cluster" : "$(CLUSTER)", "zone" : "$(ZONE)", "replicas" : "$(REPLICAS)", "log-level" : "$(LOG_LEVEL)", "app" : "${APP}", "hostname" : "$(HOSTNAME)"}' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-stage1-clb: SERVICE_NAME=stage1-clb-ss-hlsvc
k8s-delete-stage1-clb:
	kubectl delete -f ${SERVICE_NAME}.yaml

k8s-shell-stage1-clb: SERVICE_NAME=stage1-clb-ss-hlsvc
k8s-shell-stage1-clb: LOG_LEVEL=debug
k8s-shell-stage1-clb:
	kubectl exec ${SERVICE_NAME}-0 --container stage1 -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) exec -l /bin/bash"




