import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { s3Client } from "../config/aws.js";
import { BUCKET } from "../utils/constants.js";

export async function uploadToS3(prefix, base64Data) {
  try {
    //transfor string to base64 format
    let base64String = base64Data;
    let actualContentType = null;

    if (base64Data.includes(",")) {
      const parts = base64Data.split(",");
      base64String = parts[1];

      // Extract content type from data URL if not provided
      if (!actualContentType && parts[0].includes(":")) {
        const match = parts[0].match(/data:([^;]+)/);
        if (match) {
          actualContentType = match[1];
        }
      }
    }

    const buffer = Buffer.from(base64String, "base64");
    const key = `${prefix}${uuid()}`;

    console.log("Uploading to S3 with prefix:", prefix);
    console.log("Uploading to S3 with key:", key);

    // Default to image/jpeg if still no content type
    if (!actualContentType) {
      actualContentType = "image/jpeg";
      console.warn("No content type provided, defaulting to image/jpeg");
    }

    console.log("Content Type:", actualContentType);

    console.log("Data length:", base64Data?.length);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: actualContentType,
      })
    );

    return key;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file");
  }
}

export async function getS3SignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  // Debug: Check what we're getting
  console.log("Signed URL type:", typeof signedUrl);
  console.log("Signed URL value:", signedUrl);

  // Make sure it's a string
  if (!signedUrl || typeof signedUrl !== "string") {
    throw new Error("Failed to generate signed URL");
  }
  return signedUrl;
}

export async function getS3Object(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convertir el stream a buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      Body: buffer,
      ContentType: response.ContentType,
      ContentLength: response.ContentLength,
    };
  } catch (error) {
    console.error("S3 getObject error:", error);
    throw error;
  }
}

export async function deleteFromS3(key) {
  // Implement if needed
}
