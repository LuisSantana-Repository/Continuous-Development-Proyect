docker exec -it mysql-secondary mysql -uadmin -p3deAsada. -e "SHOW DATABASES;"
docker exec -it mysql-primary mysql -uadmin -p3deAsada. -e "SHOW DATABASES;"
aws --endpoint-url=http://localhost:4566 s3 ls
curl http://localhost:3000/health
docker-compose build
docker-compose up -d
docker-compose restart api


### Para correr el docker del front end

- Dentro de la carpeta donde esta el dockerfile
`docker build --progress=plain -t stamin-up-test:latest .`

- Correr el container
docker run -d --name stamin-up -p 3000:3000 stamin-up-test:latest




terraform apply -target="module.ecr"


bash ./scripts/build-and-push-to-ecr.sh

cd terraform
terraform init
terraform apply


scp -i ./terraform/aws-ec2 init-db-primary.sql ubuntu@ec2-3-90-109-253.compute-1.amazonaws.com:~/
scp -i ./terraform/aws-ec2 init-db-secondary.sql ubuntu@ec2-3-90-109-253.compute-1.amazonaws.com:~/

pwd:hello
ssh -i ./terraform/aws-ec2 ubuntu@ec2-3-90-109-253.compute-1.amazonaws.com

sudo apt-get install -y mysql-client

mysql -h stamin-up-primary-db.c4nc2a268upb.us-east-1.rds.amazonaws.com -u admin -p < init-db-primary.sql
pwd:3deAsada.


mysql -h stamin-up-secondary-db.c4nc2a268upb.us-east-1.rds.amazonaws.com -u admin -p < init-db-secondary.sql


#verify
mysql -h stamin-up-primary-db.c4nc2a268upb.us-east-1.rds.amazonaws.com -u admin
