# Configurar endpoint
export AWS_ENDPOINT=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# S3 - Listar buckets
aws --endpoint-url=$AWS_ENDPOINT s3 ls

# S3 - Crear bucket
aws --endpoint-url=$AWS_ENDPOINT s3 mb s3://mi-bucket

# S3 - Subir archivo
aws --endpoint-url=$AWS_ENDPOINT s3 cp file.jpg s3://mi-bucket/

# S3 - Listar objetos
aws --endpoint-url=$AWS_ENDPOINT s3 ls s3://mi-bucket/

# DynamoDB - Listar tablas
aws --endpoint-url=$AWS_ENDPOINT dynamodb list-tables

# DynamoDB - Crear tabla
aws --endpoint-url=$AWS_ENDPOINT dynamodb create-table \
  --table-name usuarios \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# DynamoDB - Insertar item
aws --endpoint-url=$AWS_ENDPOINT dynamodb put-item \
  --table-name usuarios \
  --item '{"id":{"S":"123"},"name":{"S":"Juan"}}'

# DynamoDB - Consultar
aws --endpoint-url=$AWS_ENDPOINT dynamodb get-item \
  --table-name usuarios \
  --key '{"id":{"S":"123"}}'