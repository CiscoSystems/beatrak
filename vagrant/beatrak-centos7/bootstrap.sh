echo "----------------------------------------"
echo "- bootstrap.sh"
echo "----------------------------------------"
if ! [[ -n "$(sudo cat /etc/sudoers | grep vagrant)" ]]; then
    echo "vagrant ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi

echo "----------------------------------------"
echo "- installing docker"
echo "----------------------------------------"
yum install -y yum-utils device-mapper-persistent-data lvm2 git
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install -y docker-ce-18.03.0.ce
sudo usermod -aG docker vagrant
systemctl enable docker && systemctl start docker

echo "----------------------------------------"
echo "- installing go"
echo "----------------------------------------"
cd /usr/local
if ! [ -f go1.10.1.linux-amd64.tar.gz ]; then
    curl -O https://dl.google.com/go/go1.10.1.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.10.1.linux-amd64.tar.gz
cat <<EOF >> ~/.bashrc
export PATH=$PATH:/usr/local/go/bin:/root/go/bin:/usr/local/bin
EOF
cat <<EOF >> /home/vagrant/.bashrc
export PATH=$PATH:/usr/local/go/bin:/home/vagrant/go/bin:/usr/local/bin
EOF
export PATH=$PATH:/usr/local/go/bin:/root/go/bin:/usr/local/bin
fi

echo "----------------------------------------"
echo "- disabling firewall and swap"
echo "----------------------------------------"
systemctl disable firewalld
swapoff -a
awk '!/swap/' /etc/fstab > /tmp/fstab_temp && sudo mv /tmp/fstab_temp /etc/fstab

if [[ $(kubectl get pods 2>&1) != *"No resources found."* ]]; then

    echo "----------------------------------------"
    echo "- installing kubeadm k8s"
    echo "----------------------------------------"
    if [[ $(crictl 2>&1) = *"command not found"* ]]; then
	echo "go get cricrl"
	go get github.com/kubernetes-incubator/cri-tools/cmd/crictl
    fi
    yum -y upgrade

cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]  
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF

cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

    sysctl --system
    setenforce 0
    yum install -y kubelet kubeadm kubectl
    yum -y upgrade
    sed -i "s/cgroup-driver=systemd/cgroup-driver=cgroupfs/g" /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
    systemctl daemon-reload
    systemctl enable kubelet && systemctl start kubelet
    
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
echo "- installing weave"
echo "----------------------------------------"
if [[ $(weave 2>&1) = *"command not found"* ]]; then
    echo "install weave..."
    kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
    curl -L git.io/weave -o /usr/local/bin/weave
    chmod a+x /usr/local/bin/weave
    weave
fi

echo "----------------------------------------"
echo "- installing ansible"
echo "----------------------------------------"
yum install -y ansible

echo "----------------------------------------"
echo "- installing devtools"
echo "----------------------------------------"
yum install -y ncurses-devel ghutls-devel libxml2-devel automake autoconf 
yum groupinstall -y "Development Tools"

echo "----------------------------------------"
echo "- setting up src"
echo "----------------------------------------"
user=vagrant
mkdir -p /home/$user/src/github.com
chown -R $(id $user -u):$(id $user -g) /home/$user/src








