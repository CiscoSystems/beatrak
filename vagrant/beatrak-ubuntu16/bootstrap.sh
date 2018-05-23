echo "----------------------------------------"
echo "- bootstrap.sh"
echo "----------------------------------------"

if ! [[ -n "$(sudo cat /etc/sudoers | grep vagrant)" ]]; then
    echo "vagrant ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi

echo "----------------------------------------"
echo "- installing docker"
echo "----------------------------------------"
if [[ $(docker version 2>&1) != *"Version"* ]]; then
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") $(lsb_release -cs) stable"
    apt-get update && apt-get install -y docker-ce=$(apt-cache madison docker-ce | grep 17.03 | head -1 | awk '{print $3}')
    sudo apt-mark hold docker-ce
fi


echo "----------------------------------------"
echo "- installing go"
echo "----------------------------------------"
cd /usr/local
if ! [ -f go1.10.1.linux-amd64.tar.gz ]; then
    curl -O https://dl.google.com/go/go1.10.1.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.10.1.linux-amd64.tar.gz
mkdir -p /root/go/bin
cat <<EOF >> ~/.bashrc
export GOPATH=~/go
export PATH=$PATH:/usr/local/go/bin:/root/go/bin:/usr/local/bin
EOF
mkdir -p /home/vagrant/bin
cat <<EOF >> /home/vagrant/.bashrc
export GOPATH=~/go
export PATH=$PATH:/usr/local/go/bin:/home/vagrant/go/bin:/usr/local/bin
EOF

curl https://glide.sh/get | sh

fi
export GOPATH=~/go
export PATH=$PATH:/usr/local/go/bin:/root/go/bin:/usr/local/bin

echo "----------------------------------------"
echo "- disabling firewall and swap"
echo "----------------------------------------"
ufw disable
awk '!/swap/' /etc/fstab > /tmp/fstab_temp && sudo mv /tmp/fstab_temp /etc/fstab
awk '{sub(/PasswordAuthentication no/,"PasswordAuthentication yes"); print }' /etc/ssh/sshd_config > /tmp/sshd_config && mv /tmp/sshd_config /etc/ssh/sshd_config
systemctl restart sshd

if [[ $(kubectl get pods 2>&1) != *"No resources found."* ]]; then
    echo "----------------------------------------"
    echo "- installing kubeadm k8s"
    echo "----------------------------------------"
    if [[ $(crictl 2>&1) = *"command not found"* ]]; then
	echo "go get cricrl"
	go get github.com/kubernetes-incubator/cri-tools/cmd/crictl
    fi

    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
    	echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
    
    # available versions
    # curl -s https://packages.cloud.google.com/apt/dists/kubernetes-xenial/main/binary-amd64/Packages | grep Version | awk '{print $2}'
    apt-get update -q && \
	apt-get install -qy kubelet=1.10.3-00 kubeadm=1.10.3-00 kubectl=1.10.3-00 && \
	sudo apt-mark hold kubelet kubeadm kubectl

    kubeadm init
    ### root
    mkdir -p $HOME/.kube
    cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    chown $(id -u):$(id -g) $HOME/.kube/config
    kubectl taint nodes --all node-role.kubernetes.io/master-

    ### vagrant
    user=vagrant
    mkdir -p /home/$user/.kube
    cp -i /etc/kubernetes/admin.conf /home/$user/.kube/config
    sudo chown $(id $user -u):$(id $user -g) /home/$user/.kube/config
fi

echo "----------------------------------------"
echo "- weave"
echo "----------------------------------------"
if [[ $(weave 2>&1) = *"command not found"* ]]; then
    echo "install weave..."
    kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
    curl -L git.io/weave -o /usr/local/bin/weave
    chmod a+x /usr/local/bin/weave
##    weave status
fi

echo "----------------------------------------"
echo "- jdk"
echo "----------------------------------------"
apt-get install -y openjdk-8-jdk
apt-get install -y maven

echo "----------------------------------------"
echo "- dev tools"
echo "----------------------------------------"
apt-get install -y build-essential git make
apt-get install -y dkms build-essential linux-headers-`uname -r`
apt-get install -y virtualbox-guest-utils virtualbox-guest-dkms
apt-get install -y libtool
apt-get install -y cmake
apt-get install -y realpath
apt-get install -y clang-format-5.0
apt-get install -y automake

echo "deb [arch=amd64] http://storage.googleapis.com/bazel-apt stable jdk1.8" | tee /etc/apt/sources.list.d/bazel.list
curl https://bazel.build/bazel-release.pub.gpg | apt-key add -
apt-get update && apt-get install -y bazel
apt-get upgrade bazel
go get github.com/bazelbuild/buildtools/buildifier

cd /tmp
git clone https://github.com/bats-core/bats-core.git
cd bats-core
./install.sh /usr/local

echo "----------------------------------------"
echo "- nodejs tools"
echo "----------------------------------------"
curl -sL https://deb.nodesource.com/setup_8.x |  bash -
apt-get install -y nodejs
npm install --global yarn forever
npm update --global
