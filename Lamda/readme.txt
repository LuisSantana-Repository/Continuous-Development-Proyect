-- Generate tables
-- Enviroment variables:
DB_SECRET_ARN → Secrets Manager JSON: {"host": "...", "username":"...", "password":"...", "dbname":"...", "port":3306}
JWT_SECRET: STRING FOR COOKIES

--login
npm i mysql2 bcryptjs jsonwebtoken @aws-sdk/client-secrets-manager
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
