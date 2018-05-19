echo "----------------------------------------"
echo "- vm-user.sh"
echo "----------------------------------------"

VM_USER=$1
echo "setting up VM_USER="$VM_USER
if ! [[ -n "$(sudo cat /etc/sudoers | grep $VM_USER)" ]]; then
    # first provision
    useradd --create-home --shell /bin/bash $VM_USER
    (echo $VM_USER; echo $VM_USER) | passwd $VM_USER
    echo "$VM_USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
    sudo usermod -aG docker $VM_USER

cat <<EOF >> /home/$VM_USER/.bashrc
export GOPATH=~/go
export PATH=$PATH:/usr/local/go/bin:/home/$VM_USER/go/bin:/usr/local/bin
EOF

mkdir -p /home/$VM_USER/.kube
cp -i /etc/kubernetes/admin.conf /home/$VM_USER/.kube/config
sudo chown $(id $VM_USER -u):$(id $user -g) /home/$VM_USER/.kube/config

mkdir -p /home/$VM_USER/src/github.com
chown -R $(id $VM_USER -u):$(id $VM_USER -g) /home/$VM_USER/src

fi


