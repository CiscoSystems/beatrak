
# we can be passing target like in
# $ TARGET=devshell make

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
	@echo "-          beacon-za (prod)"
	@echo "-          beacon-zb (prod)"
	@echo "- ex.: $$ TARGET=prod make build"
	@echo "-      $$ TARGET=devshell make create"
	@echo "-      $$ TARGET=beacon-za make delete"
	@echo "-"
	@echo "-"
	@echo "-"
	@echo "----------------------------------------"

#
# TOP
#
build: env banner k8s-build-${TARGET}
create: env banner k8s-create-${TARGET}
delete: env banner k8s-delete-${TARGET}
shell: env banner k8s-shell-${TARGET}
shell-envoy: banner k8s-shell-envoy-${TARGET}

# LB wtih cla and clx (not accesible)
#config: CONFIG_FILE=envoy-lb-cla-clb.json
# LB cla only
#config: CONFIG_FILE=envoy-lb-cla.json
# WIP
# stage1-cla, stage1-clb colusters difined
# all traffic goes to stage1-cla cluster
#config: CONFIG_FILE=envoy-rt-cla.json
#config: CONFIG_FILE=envoy-rt-wt-cla50-clb50.json
#config: CONFIG_FILE=envoy-rt-wt-cla20-clb80.json
#config: CONFIG_FILE=envoy-rt-wt-cla0-clb100.json
config: CONFIG_FILE=envoy-new.json
config: env banner k8s-config-$(TARGET)


#
# PROD
#
k8s-build-prod:
	mkdir -p ./beacon-msvc/common/
	cp -rf ../common/* ./beacon-msvc/common/
	cp -rf ./envoy-configs/envoy-default.json ./beacon-envoy/envoy.json
	$(MAKE) -C ./beacon-msvc k8s-build
	$(MAKE) -C ./beacon-envoy k8s-build

#
# BEACON-ZA
#
k8s-build-beacon-za: env
k8s-build-beacon-za: k8s-build-prod
k8s-create-beacon-za: LOG_LEVEL=debug
k8s-create-beacon-za: SERVICE_NAME=${TARGET}-ss-hlsvc
k8s-create-beacon-za: APP=${SERVICE_NAME}
k8s-create-beacon-za: ZONE=za
k8s-create-beacon-za: REPLICAS=1
k8s-create-beacon-za: BEACON_SIG_NUMBER=-1
k8s-create-beacon-za: BEACON_SIG_PS=5
k8s-create-beacon-za: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=beacon-ss-hlsvc.templ.yaml --data='{"service-name" : "$(SERVICE_NAME)", "app" : "$(APP)", "replicas" : "$(REPLICAS)", "zone" : "$(ZONE)", "log-level" : "$(LOG_LEVEL)", "beacon-sig-number" : "$(BEACON_SIG_NUMBER)", "beacon-sig-ps": "$(BEACON_SIG_PS)" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml



k8s-delete-beacon-za: SERVICE_NAME=${TARGET}-ss-hlsvc
k8s-delete-beacon-za:
	kubectl delete -f ./${SERVICE_NAME}.yaml

k8s-shell-beacon-za:
	kubectl exec ${SERVICE_NAME}-0 --container beacon -i -t -- /bin/bash -l -c "LOG_LEVEL=error BEACON_SIG_NUMBER=-1 BEACON_SIG_PS=1 exec -l /bin/bash"


#
# BEACON-ZB
#

k8s-build-beacon-zb: k8s-build-prod

k8s-create-beacon-zb: env
k8s-create-beacon-zb: LOG_LEVEL=error
k8s-create-beacon-zb: SERVICE_NAME=$(TARGET)-ss-hlsvc
k8s-create-beacon-zb: APP=${SERVICE_NAME}
k8s-create-beacon-zb: ZONE=zb
k8s-create-beacon-zb: REPLICAS=1
k8s-create-beacon-zb: BEACON_SIG_NUMBER=-1
k8s-create-beacon-zb: BEACON_SIG_PS=5
k8s-create-beacon-zb: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=beacon-ss-hlsvc.templ.yaml --data='{"service-name" : "$(SERVICE_NAME)", "app" : "$(APP)", "replicas" : "$(REPLICAS)", "zone" : "$(ZONE)", "log-level" : "$(LOG_LEVEL)", "beacon-sig-number" : "$(BEACON_SIG_NUMBER)", "beacon-sig-ps": "$(BEACON_SIG_PS)" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f ./${SERVICE_NAME}.yaml

k8s-delete-beacon-zb: SERVICE_NAME=${TARGET}-ss-hlsvc
k8s-delete-beacon-zb:
	kubectl delete -f ./${SERVICE_NAME}.yaml

k8s-shell-beacon-zb:
	kubectl exec ${SERVICE_NAME}-0 --container beacon -i -t -- /bin/bash -l -c "LOG_LEVEL=error BEACON_SIG_NUMBER=-1 BEACON_SIG_PS=1 exec -l /bin/bash"


#
# K8s DEVSHELL
#
k8s-build-devshell:
	$(MAKE) -C ./beacon-msvc k8s-build-devshell
	$(MAKE) -C ./beacon-envoy k8s-build

k8s-create-devshell: env
k8s-create-devshell: NODE=${HOSTNAME}
k8s-create-devshell: REPLICAS=1
k8s-create-devshell: LOG_LEVEL=debug
k8s-create-devshell: SERVICE_NAME=beacon-devshell-ss-hlsvc
k8s-create-devshell: APP=${SERVICE_NAME}
k8s-create-devshell: ZONE=zdevshell
k8s-create-devshell: BEACON_SIG_NUMBER=-1
k8s-create-devshell: BEACON_SIG_PS=1
k8s-create-devshell: APP_VOLUME_PATH=${ROOT_SRC_DIR}/beacon/beacon-msvc/app
k8s-create-devshell: COMMON_VOLUME_PATH=${ROOT_SRC_DIR}/common
k8s-create-devshell: 
	${ROOT_SRC_DIR}/tools/templ.js --templ=${SERVICE_NAME}.templ.yaml --data='{ "service-name" : "${SERVICE_NAME}", "app" : "${APP}", "zone" : "${ZONE}", "log-level" : "${LOG_LEVEL}", "beacon-sig-number" : "${BEACON_SIG_NUMBER}", "beacon-sig-ps": "${BEACON_SIG_PS}", "hostname" : "${NODE}", "app-volume-path" : "${APP_VOLUME_PATH}", "common-volume-path" : "${COMMON_VOLUME_PATH}", "replicas" : "${REPLICAS}" }' --file=${SERVICE_NAME}.yaml
	kubectl create -f beacon-devshell-ss-hlsvc.yaml

k8s-delete-devshell: 
	kubectl delete -f beacon-devshell-ss-hlsvc.yaml

# run /start-dev.sh
# (trace/debug/info/warn/error
# this ENV will overwrite env that was set
# during pod create
k8s-shell-devshell: SERVICE_NAME=beacon-devshell-ss-hlsvc
k8s-shell-devshell: LOG_LEVEL=debug
k8s-shell-devshell: ZONE=zdevshell
k8s-shell-devshell: BEACON_SIG_NUMBER=-1
k8s-shell-devshell: BEACON_SIG_PS=1
k8s-shell-devshell:
	kubectl exec ${SERVICE_NAME}-0 --container beacon -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) ZONE=$(ZONE) BEACON_SIG_NUMBER=$(BEACON_SIG_NUMBER) BEACON_SIG_PS=$(BEACON_SIG_PS) exec -l /bin/bash"

k8s-shell-envoy-devshell: LOG_LEVEL=debug
k8s-shell-envoy-devshell: ZONE=zdevshell
k8s-shell-envoy-devshell: BEACON_SIG_NUMBER=-1
k8s-shell-envoy-devshell: BEACON_SIG_PS=1
k8s-shell-envoy-devshell:
	kubectl exec ${SERVICE_NAME} --container envoy -i -t -- /bin/bash -l -c "LOG_LEVEL=$(LOG_LEVEL) ZONE=$(ZONE) BEACON_SIG_NUMBER=$(BEACON_SIG_NUMBER) BEACON_SIG_PS=$(BEACON_SIG_PS) exec -l /bin/bash"


k8s-config-devshell: POD_NAME=beacon-devshell
k8s-config-devshell:
	kubectl cp ./envoy-configs/$(CONFIG_FILE) $(POD_NAME):/ -c envoy
	kubectl exec $(POD_NAME) -c envoy -- /bin/bash -c "cp -f /envoy.json /envoy.old.json; cp -f /$(CONFIG_FILE) /envoy.json;"
	kubectl exec $(POD_NAME) -c envoy -- /restart-envoy.sh




#
# config scripts
#
#env: 
#	$(eval export NODE_PATH=$(shell npm get prefix)/lib/node_modules:../common/)

config-beacons: env
config-beacons: CONFIG_FILE=./envoy-configs/envoy-beacon-zx.json
config-beacons:
	LOG_LEVEL=DEBUG CONFIG_FILE=$(CONFIG_FILE) ./config-beacons.js



