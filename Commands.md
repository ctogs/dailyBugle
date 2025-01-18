Commands for k8s deployment:

kind create cluster --config kind-cluster.yaml --name dailybugle

kind load docker-image dailybugle-auth-service --name dailybugle && kind load docker-image dailybugle-article-service --name dailybugle && kind load docker-image dailybugle-ad-service --name dailybugle && kind load docker-image dailybugle-frontend --name dailybugle

kubectl apply -f pv-claim.yaml && kubectl apply -f pv-volume.yaml && kubectl apply -f single-pod.yaml


*** Optional
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard

kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443

kubectl apply -f dashboard-adminuser.yaml && kubectl apply -f cluster-adminrole.yaml

kubectl -n kubernetes-dashboard create token admin-user
- use the token to sign in to k8s dashboard



kubectl port-forward pod/dailybugle-pod 8080:8080

kubectl port-forward pod/dailybugle-pod 27018:27017
- actually host the application




MONGODB FAIL TROUBLESHOOT:

rm /opt/homebrew/var/mongodb/WiredTiger*
rm /opt/homebrew/var/mongodb/storage.bson
rm /opt/homebrew/var/mongodb/mongod.lock

cp -r /opt/homebrew/var/mongodb /Users/collintogher/Documents/databackup
rm -rf /opt/homebrew/var/mongodb/*

This deletes the entire db so make a backup

mongod --dbpath /opt/homebrew/var/mongodb  --repair