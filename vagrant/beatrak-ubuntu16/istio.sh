echo "----------------------------------------"
echo "- istio.sh"
echo "----------------------------------------"
if [[ "$(istioctl)" != *"something istio"* ]]; then
    echo "install istio"
    chmod -R a+rwx /usr/local/src
    cd /usr/local/src
    curl -L https://git.io/getLatestIstio | ISTIO_VERSION=0.7.0 sh -
    export PATH="$PATH:/usr/local/src/istio-0.7.0/bin"
    cd istio-0.7.0
    kubectl apply -f install/kubernetes/istio.yaml

    #
    # should be this below
    #
    # NAMESPACE      NAME                                       READY     STATUS    RESTARTS   AGE
    # istio-system   istio-ca-c9bb9bdcd-2kgsq                   1/1       Running   0          2m
    # istio-system   istio-ingress-77478978b8-x4lgv             1/1       Running   0          2m
    # istio-system   istio-mixer-5dfb866577-m6gvk               3/3       Running   0          2m
    # istio-system   istio-pilot-795845ff86-7j2zn               2/2       Running   0          2m
    
    # injector
    #
    #    kubectl api-versions | grep admissionregistration
    #
    #    ./install/kubernetes/webhook-create-signed-cert.sh \
    #	--service istio-sidecar-injector \
    #	--namespace istio-system \
    #	--secret sidecar-injector-certs

    #    kubectl apply -f install/kubernetes/istio-sidecar-injector-configmap-release.yaml

    #    cat install/kubernetes/istio-sidecar-injector.yaml | \
    #     ./install/kubernetes/webhook-patch-ca-bundle.sh > \
    #     install/kubernetes/istio-sidecar-injector-with-ca-bundle.yaml

    #    kubectl apply -f install/kubernetes/istio-sidecar-injector-with-ca-bundle.yaml
    #    kubectl -n istio-system get deployment -listio=sidecar-injector
fi



