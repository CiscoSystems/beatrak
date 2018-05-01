build: k8s-build
create: k8s-create-svc
delete: k8s-delete-svc
shell: k8s-shell
get-postgres-IP:
	$(eval POSTGRES_IP=$(shell kubectl get svc postgresql-dep-svc -o jsonpath="{.spec.clusterIP}"))
	@echo "postgres IP = ${POSTGRES_IP}"

client: get-postgres-IP
	psql --username=postgres --host=${POSTGRES_IP} --port=50005

gen: get-postgres-IP
	psql --username=postgres --host=${POSTGRES_IP} --port=50005 --file=./postgresql-svc/config/gen.sql
	psql --username=postgres --host=${POSTGRES_IP} --port=50005 --command="\d+"


k8s-build:
	$(MAKE) -C ./postgresql-svc k8s-build

#
# this manifest is for regular SVC
#
k8s-create-svc:
	kubectl create -f ./postgresql-dep-svc.yaml

k8s-delete-svc:
	kubectl delete -f ./postgresql-dep-svc.yaml

k8s-shell: POD=$(shell kubectl get pods | grep postgresql | awk '{print $$1}')
k8s-shell:
	@echo "POD = " $(POD)
	kubectl exec $(POD) -i -t -- /bin/bash

k8s-installgen:
	${ROOT_SRC_DIR}/tools/templ.js --templ=postgresql-dep-svc.templ.yaml --data='{ "beatrak_root" : "${ROOT_SRC_DIR}", "extSvcNodePort": "${EXT_SVC_NODEPORT}", "extSvcExtIP": "${EXT_SVC_IP}" }' --file=postgresql-dep-svc.yaml
