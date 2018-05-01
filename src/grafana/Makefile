build: k8s-build
create: k8s-create-svc
delete: k8s-delete-svc
shell: k8s-shell

k8s-build:
	$(MAKE) -C ./grafana-svc k8s-build

k8s-create-svc:
	kubectl create -f ./grafana-svc.yaml

k8s-delete-svc:
	kubectl delete -f ./grafana-svc.yaml

k8s-shell:
	kubectl exec grafana-svc-865621956-p4pjz -i -t -- /bin/bash

k8s-installgen:
	${ROOT_SRC_DIR}/tools/templ.js --templ=grafana-svc.templ.yaml --data='{ "beatrak_root" : "${ROOT_SRC_DIR}", "extSvcNodePort": "${EXT_SVC_NODEPORT}", "extSvcExtIP": "${EXT_SVC_IP}" }' --file=grafana-svc.yaml


