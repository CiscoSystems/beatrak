all: beatrak-ca-cert.pem \
	beatrak-server-key.pem \
	beatrak-server-csr.pem \
	beatrak-server-cert.pem \
	beatrak-client1-key.pem \
	beatrak-client2-key.pem \
	beatrak-client1-csr.pem \
	beatrak-client2-csr.pem \
	beatrak-client1-cert.pem \
	beatrak-client2-cert.pem \
	beatrak-client-verify

beatrak-client1-cert.pem: beatrak-client1.conf beatrak-client1-csr.pem beatrak-ca-cert.pem beatrak-ca-key.pem
	@echo "--------------------------------------"
	@echo "- generating CLIENT 1 CERT pem(s)"
	@echo "--------------------------------------"
	openssl x509 -req -extfile beatrak-client1.conf -passin "pass:password" -in beatrak-client1-csr.pem -CA beatrak-ca-cert.pem -CAkey beatrak-ca-key.pem -CAcreateserial -out beatrak-client1-cert.pem

beatrak-client2-cert.pem: beatrak-client2.conf beatrak-client2-csr.pem beatrak-ca-cert.pem beatrak-ca-key.pem
	@echo "--------------------------------------"
	@echo "- generating CLIENT 2 CERT pem(s)"
	@echo "--------------------------------------"
	openssl x509 -req -extfile beatrak-client2.conf -passin "pass:password" -in beatrak-client2-csr.pem -CA beatrak-ca-cert.pem -CAkey beatrak-ca-key.pem -CAcreateserial -out beatrak-client2-cert.pem

beatrak-client1-csr.pem: beatrak-client1.conf beatrak-client1-key.pem
	@echo "--------------------------------------"
	@echo "- generating CLIENT 1 CSR pem(s)"
	@echo "--------------------------------------"
	openssl req -new -config beatrak-client1.conf -key beatrak-client1-key.pem -out beatrak-client1-csr.pem

beatrak-client2-csr.pem: beatrak-client2.conf beatrak-client2-key.pem
	@echo "--------------------------------------"
	@echo "- generating CLIENT 2 CSR pem(s)"
	@echo "--------------------------------------"
	openssl req -new -config beatrak-client2.conf -key beatrak-client2-key.pem -out beatrak-client2-csr.pem

beatrak-client1-key.pem:
	@echo "--------------------------------------"
	@echo "- generating CLIENT 1 KEY pem(s)"
	@echo "--------------------------------------"
	openssl genrsa -out beatrak-client1-key.pem 4096

beatrak-client2-key.pem:
	@echo "--------------------------------------"
	@echo "- generating CLIENT 2 KEY pem(s)"
	@echo "--------------------------------------"
	openssl genrsa -out beatrak-client2-key.pem 4096

beatrak-server-cert.pem: beatrak-server.conf beatrak-server-csr.pem beatrak-ca-cert.pem beatrak-ca-key.pem
	@echo "--------------------------------------"
	@echo "- generating SERVER CERT pem(s)"
	@echo "--------------------------------------"
	openssl x509 -req -extfile beatrak-server.conf -passin "pass:password" -in beatrak-server-csr.pem -CA beatrak-ca-cert.pem -CAkey beatrak-ca-key.pem -CAcreateserial -out beatrak-server-cert.pem

beatrak-server-csr.pem: beatrak-server.conf beatrak-server-key.pem
	@echo "--------------------------------------"
	@echo "- generating SERVER CSR pem(s)"
	@echo "--------------------------------------"
	openssl req -new -config beatrak-server.conf -key beatrak-server-key.pem -out beatrak-server-csr.pem

beatrak-server-key.pem:
	@echo "--------------------------------------"
	@echo "- generating SERVER KEY pem(s)"
	@echo "--------------------------------------"
	openssl genrsa -out beatrak-server-key.pem 4096

beatrak-ca-cert.pem: beatrak-ca-key.pem
beatrak-ca-key.pem: beatrak-ca.conf
	@echo "--------------------------------------"
	@echo "- generating BEATRAK CA pem(s)"
	@echo "--------------------------------------"
	openssl req -new -x509 -config beatrak-ca.conf -keyout beatrak-ca-key.pem -out beatrak-ca-cert.pem

beatrak-client-verify:
	@echo "--------------------------------------"
	@echo "- verifying CLIENT N CERT pem(s)"
	@echo "--------------------------------------"
	openssl verify -CAfile beatrak-ca-cert.pem beatrak-client1-cert.pem
	openssl verify -CAfile beatrak-ca-cert.pem beatrak-client2-cert.pem

clean:
	@rm -f *.pem


