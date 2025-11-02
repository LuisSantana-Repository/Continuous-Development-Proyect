
import fetch from 'node-fetch';
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET } from "../utils/constants.js";
import { s3Client } from "../config/aws.js";

export async function getS3ImageAsBase64(key) {
    try {
        console.log('Fetching image with key:', key);

        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });

        const response = await s3Client.send(command);

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const contentType = response.ContentType || 'image/jpeg';

        console.log('Successfully converted to base64');

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error fetching image from S3:', error);
        throw error;
    }
}
