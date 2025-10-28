import express from 'express';
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

export const router = express.Router();

router.get('/', async (req, res) => {
  //basic log
  console.log('Health check endpoint called');
  // sent ok
  res.status(200).json({ status: 'OK' });
});