docker exec -it mysql-secondary mysql -uadmin -p3deAsada. -e "SHOW DATABASES;"
docker exec -it mysql-primary mysql -uadmin -p3deAsada. -e "SHOW DATABASES;"
aws --endpoint-url=http://localhost:4566 s3 ls
curl http://localhost:3000/health
docker-compose build
docker-compose up -d
docker-compose restart api
