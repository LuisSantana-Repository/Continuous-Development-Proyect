import express from 'express';
export const router = express.Router();
import mysql from "mysql2/promise";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

router.get('/', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {}
  };

  try {
    // Check MySQL Primary
    const primaryPool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await primaryPool.query('SELECT 1');
    healthcheck.checks.mysqlPrimary = 'connected';

    // Check MySQL Secondary
    const secondaryPool = await mysql.createPool({
      host: process.env.DB_SECONDARY_HOST,
      user: process.env.DB_SECONDARY_USER,
      password: process.env.DB_SECONDARY_PASSWORD,
      database: process.env.DB_SECONDARY_NAME
    });
    await secondaryPool.query('SELECT 1');
    healthcheck.checks.mysqlSecondary = 'connected';

    // Check S3
    const s3 = new S3Client({});
    await s3.send(new ListBucketsCommand({}));
    healthcheck.checks.s3 = 'connected';

    // Check DynamoDB
    const dynamodb = new DynamoDBClient({});
    await dynamodb.config.credentials();
    healthcheck.checks.dynamodb = 'connected';

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    healthcheck.error = error;
    res.status(503).json(healthcheck);
  }
});

// module.exports = router;