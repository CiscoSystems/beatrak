export ROOT_SRC_DIR := ${PWD}

# Set EXT_SVC_NODEPORT=1 to generate external services as NodePort type
#    Ex: "make ... EXT_SVC_NODEPORT=1"
export EXT_SVC_NODEPORT :=

# Set EXT_SVC_IP=<IP addr> to generate external services' IP
#    Ex: "make ... EXT_SVC_IP=10.138.0.21"
export EXT_SVC_IP := 10.0.2.15

all:


build-all:
	cd src
	$(MAKE) node-base-build
	$(MAKE) common-build
	$(MAKE) locpick-build
	$(MAKE) beacon-build
	$(MAKE) stage1-build
	$(MAKE) montrer-envoy-build
	$(MAKE) montrer-build
	$(MAKE) elastic-build
	$(MAKE) grafana-build
	$(MAKE) postgresql-build

installgen:
	-$(MAKE) elastic-installgen
	-$(MAKE) postgresql-installgen
	-$(MAKE) grafana-installgen
	-$(MAKE) montrer-installgen

create-all:
	-$(MAKE) elastic-create
	-$(MAKE) postgresql-create
	-$(MAKE) postgresql-gen
	-$(MAKE) grafana-create
	-$(MAKE) locpick-create
	-$(MAKE) beacon-create-za
	-$(MAKE) stage1-create-cla
	-$(MAKE) stage1-create-clb
	-$(MAKE) montrer-envoy-create
	-$(MAKE) montrer-create

delete-all:
	-$(MAKE) montrer-delete
	-$(MAKE) montrer-envoy-delete
	-$(MAKE) stage1-delete-cla
	-$(MAKE) stage1-delete-clb
	-$(MAKE) beacon-delete-za
	-$(MAKE) beacon-delete-zb
	-$(MAKE) locpick-delete
	-$(MAKE) grafana-delete
	-$(MAKE) postgresql-delete
	-$(MAKE) elastic-delete
	@echo "BEATRAK DELETE FINISHED"

env: 
	$(eval export NODE_PATH=$(shell npm get prefix)/lib/node_modules:${ROOT_SRC_DIR}/src/common)
#
# BEACONS
#

create-beacon-za:
	$(MAKE) -C beacon TARGET=beacon-za create

create-beacon-zb:
	$(MAKE) -C beacon TARGET=beacon-zb create

create-beacons: create-beacon-za create-beacon-zb

delete-beacon-za:
	$(MAKE) -C beacon TARGET=beacon-za delete

delete-beacon-zb:
	$(MAKE) -C beacon TARGET=beacon-zb delete

delete-beacons: delete-beacon-za delete-beacon-zb

build-beacons:
	$(MAKE) -C beacon build

#
# ENVOY_CONFIG
#
# We have the defaults, but can be ran as 
# $ make config-beacons
# $ ENVOY_CONFIG_NAME=envoy-new make config-beacons
# $ ENVOY_CONFIG_FILE = ./beacon/envoy-configs/envoy-new.json
#
# vaild configs:
# - ENVOY_CONFIG_NAME=envoy-default make config-beacons
#	. 50:50 between cla:clb for all beacons
# - ENVOY_CONFIG_NAME=envoy-skew make config-beacons
#       . 10:90 between cla:clb for all beacons
# - ENVOY_CONFIG_NAME=envoy-zonetocluster make config-beacons
#       . routes with prefixes /za->cla, /zb->clb
ifndef ENVOY_CONFIG_NAME 
ENVOY_CONFIG_NAME=envoy-new
endif

ifndef ENVOY_CONFIG_FILE
ENVOY_CONFIG_FILE=${ROOT_SRC_DIR}/src/beacon/envoy-configs/${ENVOY_CONFIG_NAME}.json
endif

config-beacons: env
config-beacons:
	LOG_LEVEL=DEBUG CONFIG_FILE=${ENVOY_CONFIG_FILE} ${ROOT_SRC_DIR}/scripts/config-beacons.js

#
# ELASTIC
#
# TODO: automate later
#elastic-node-0                            1/1       Running   33         3d        192.168.0.5    k8s-kubeadm-node-01
#elastic-node-1                            1/1       Running   53         3d        192.168.0.7    k8s-kubeadm-node-01
elastic-reset: ELASTIC_URL_0=http://10.32.0.7:9200
elastic-reset: ELASTIC_URL_1=http://10.32.0.8:9200
elastic-reset:
	-curl -XPOST '$(ELASTIC_URL_0)/beacon/_delete_by_query?pretty' -d' { "query": { "match_all": {} } }'
	-curl -XPOST '$(ELASTIC_URL_1)/beacon/_delete_by_query?pretty' -d' { "query": { "match_all": {} } }'

#
# TOP build targets
#

#
# NODE-BASE
#
node-base-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/node-base/alpine-node build
	$(MAKE) -C ${ROOT_SRC_DIR}/src/node-base build

node-base-clean:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/node-base/alpine-node clean
	$(MAKE) -C ${ROOT_SRC_DIR}/src/node-base clean

#
# COMMON
#
common-build:
	cd ${ROOT_SRC_DIR}/src/common; yarn install

#
# LOCPICK
#

locpick-build: export TARGET=prod
locpick-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick build

locpick-create: export TARGET=prod
locpick-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick create

locpick-delete: export TARGET=prod
locpick-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick delete

locpick-reset: env
	LOG_LEVEL=DEBUG ./scripts/reset-locpicks.js

locpick-build-devshell:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick build-devshell

locpick-run-devshell:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick run-devshell

locpick-create-devshell:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick create-devshell

locpick-delete-devshell:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/locpick delete-devshell


#
# BEACON
#

beacon-build: export TARGET=prod
beacon-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/beacon build

# ZA
beacon-create-za: export TARGET=beacon-za
beacon-create-za:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/beacon create
beacon-delete-za: export TARGET=beacon-za
beacon-delete-za:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/beacon delete

# ZB
beacon-create-zb: export TARGET=beacon-zb
beacon-create-zb:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/beacon create
beacon-delete-zb: export TARGET=beacon-zb
beacon-delete-zb:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/beacon delete

#
# BEACON CONFIGS
#
beacon-config-default: export ENVOY_CONFIG_NAME=envoy-default
beacon-config-default: config-beacons

beacon-config-skew: export ENVOY_CONFIG_NAME=envoy-skew
beacon-config-skew: config-beacons

beacon-config-zonetocluser: export ENVOY_CONFIG_NAME=envoy-zonetocluster
beacon-config-zonetocluser: config-beacons


#
# STAGE1
#

stage1-build: export TARGET=prod
stage1-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/stage1 build

# STAGE1-CLA
stage1-create-cla: export TARGET=stage1-cla
stage1-create-cla:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/stage1 create
stage1-delete-cla: export TARGET=stage1-cla
stage1-delete-cla:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/stage1 delete

# STAGE1-CLB
stage1-create-clb: export TARGET=stage1-clb
stage1-create-clb:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/stage1 create
stage1-delete-clb: export TARGET=stage1-clb
stage1-delete-clb:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/stage1 delete

#
# ELASTIC
#

elastic-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/elastic build

elastic-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/elastic create

elastic-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/elastic delete

elastic-installgen: env
	$(MAKE) -C ${ROOT_SRC_DIR}/src/elastic k8s-installgen

#
# GRAFANA
#

grafana-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/grafana build

grafana-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/grafana create

grafana-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/grafana delete

grafana-installgen: env
	$(MAKE) -C ${ROOT_SRC_DIR}/src/grafana k8s-installgen

#
# POSTGRES
#

postgresql-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql build

postgresql-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql create

postgresql-gen:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql gen

postgresql-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql delete

postgresql-run-shell:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql shell

postgresql-run-client:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql client

postgresql-installgen: env
	$(MAKE) -C ${ROOT_SRC_DIR}/src/postgresql k8s-installgen

#
# MONTRER
#

montrer-envoy-build: export TARGET=envoy
montrer-envoy-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer build

montrer-envoy-create: export TARGET=envoy
montrer-envoy-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer create

montrer-envoy-delete: export TARGET=envoy
montrer-envoy-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer delete


montrer-build: export TARGET=prod
montrer-build:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer build

montrer-create: export TARGET=prod
montrer-create:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer create

montrer-delete: export TARGET=prod
montrer-delete:
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer delete

montrer-installgen: env
	$(MAKE) -C ${ROOT_SRC_DIR}/src/montrer k8s-installgen