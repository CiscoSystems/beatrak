echo "----------------------------------------"
echo "- extra.sh"
echo "----------------------------------------"
VM_USER=$1

echo "----------------------------------------"
echo "- installing emacs"
echo "----------------------------------------"
add-apt-repository ppa:kelleyk/emacs
apt- install -y emacs25 

cat <<EOF >  /root/.emacs
(when (>= emacs-major-version 24)
  (require 'package)
  (add-to-list
   'package-archives
   '("melpa" . "http://melpa.milkbox.net/packages/")
   t))

(add-to-list 'package-archives '("melpa" . "http://melpa.org/packages/"))

(add-to-list 'package-archives
	     '("melpa-stable" . "http://melpa-stable.milkbox.net/packages/") t)

(package-initialize)

(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(custom-enabled-themes (quote (adwaita)))
 '(package-selected-packages
   (quote
    (markdown-mode rjsx-mode yaml-mode json-mode go-mode))))

(push (cons "\\*shell\\*" display-buffer--same-window-action) display-buffer-alist)

(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(default ((t (:inherit nil :stipple nil :background "#EDEDED" :foreground "#2E3436" :inverse-video nil :box nil :strike-through nil :overline nil :underline nil :slant normal :weight normal :height 100 :width normal :foundry "nil" :family "Menlo"))))
 '(go-coverage-10 ((t (:foreground "DarkOliveGreen4"))))
 '(mode-line ((t (:background "green1" :foreground "#2E3436" :box (:line-width -1 :style released-button))))))
EOF

if [[ $VM_USER != "" ]]; then
    echo "setting up emacs for VM_USER="$VM_USER
    cp /root/.emacs /home/$VM_USER
    chown -R $(id $VM_USER -u):$(id $VM_USER -g) /home/$VM_USER/.emacs
fi



