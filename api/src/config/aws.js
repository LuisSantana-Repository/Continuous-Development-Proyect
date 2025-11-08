import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";



const isLocal = process.env.NODE_ENV === 'development';

const awsConfig = isLocal
    ? {
        endpoint: process.env.AWS_ENDPOINT || "http://localhost:4566",
        region: process.env.AWS_REGION || "mx-central-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test"
        },
        forcePathStyle: true
    }
    : {
        region: process.env.AWS_REGION || "mx-central-1"
    };

export const s3Client = new S3Client(awsConfig);
export const dynamoDBClient = new DynamoDBClient(awsConfig);

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
    marshallOptions: {
        removeUndefinedValues: true, // Remove undefined values
        convertEmptyValues: false,    // Don't convert empty strings/sets
    },
});