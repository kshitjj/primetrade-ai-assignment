update-configmap-postgres:
	kubectl create configmap postgres-init --from-file=init.sql --dry-run=client -o yaml > k8s/postgres-configmap.yml # This puts the new init.sql which contains database schema for the system.
apply-k8s:
	kubectl apply -f  k8s
