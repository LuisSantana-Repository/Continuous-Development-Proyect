import express from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getPrimaryPool, getSecondaryPool } from "../config/database.js";
import { s3Client, dynamoDBClient } from "../config/aws.js";
import { BUCKET, DYNAMODB_TABLE } from "../utils/constants.js";

export const router = express.Router();

router.get('/', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {}
  };

  // Check Primary Database
  try {
    const db = await getPrimaryPool();
    await db.execute("SELECT 1 as ping");
    checks.checks.database_primary = { status: "ok", message: "Connected" };
  } catch (error) {
    checks.status = "unhealthy";
    checks.checks.database_primary = { status: "error", message: error.message };
  }

  // Check Secondary Database
  try {
    const dbSecondary = await getSecondaryPool();
    await dbSecondary.execute("SELECT 1 as ping");
    checks.checks.database_secondary = { status: "ok", message: "Connected" };
  } catch (error) {
    checks.status = "unhealthy";
    checks.checks.database_secondary = { status: "error", message: error.message };
  }

  // Check S3
  try {
    await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: "test" }));
    checks.checks.s3 = { status: "ok", message: "Accessible" };
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      checks.checks.s3 = { status: "ok", message: "Accessible" };
    } else {
      checks.checks.s3 = { status: "warning", message: error.message };
    }
  }

  // Check DynamoDB
  try {
    await dynamoDBClient.send(new GetItemCommand({ 
      TableName: DYNAMODB_TABLE, 
      Key: { userId: { S: "healthcheck" } } 
    }));
    checks.checks.dynamodb = { status: "ok", message: "Accessible" };
  } catch (error) {
    checks.checks.dynamodb = { status: "warning", message: error.message };
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(checks);
});