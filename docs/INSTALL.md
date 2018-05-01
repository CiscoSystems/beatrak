# Installation of beatrak
1. (Onetime) Customize k8s manifests to environment
   1. (For NodePort external svcs) `make installgen EXT_SVC_NODEPORT=1`
   1. (For externalIP external svcs) `make installgen EXT_SVC_IP=10.238.0.21`
      - where `10.238.0.21` is the external service IP to use in k8s services.
1. `make create-all`
