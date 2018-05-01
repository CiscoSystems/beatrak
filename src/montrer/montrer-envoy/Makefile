IMAGE_NAME="beatrak/montrer-envoy"
CONTAINER_NAME="montrer-envoy"
#
# k8s
#

k8s-build:
	docker build --rm -t $(IMAGE_NAME) .

k8s-reconfig-envoy:
	kubectl cp envoy.json.new $(CONTAINER_NAME):/
	kubectl exec $(CONTAINER_NAME) -- /bin/bash -c "cp -f /envoy.json /envoy.json.old; cp -f /envoy.json.new /envoy.json;"
	kubectl exec $(CONTAINER_NAME) -- /restart-envoy.sh

k8s-shell:
	kubectl exec $(CONTAINER_NAME) -it -- /bin/bash --rcfile doesnotmatter

k8s-log:
	kubectl log $(CONTAINER_NAME)
