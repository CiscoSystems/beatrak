export VM_USER=beatraker
export VM_NAME=beatrak
#export EXTRA # deploy some extra packages like emacs if defined

create:
	@echo "VM_USER="${VM_USER}
	@echo "VM_NAME="${VM_NAME}
	vagrant up
stop:
	vagrant halt
prov:
	vagrant provision
delete:
	vagrant destroy
ssh:
	vagrant ssh

shell:
	ssh -p 2222 ${VM_USER}@localhost
