import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { s3Client } from "../config/aws.js";
import { BUCKET } from "../utils/constants.js";

export async function uploadToS3(prefix, base64Data, contentType) {
  try {
    //transfor string to base64 format

    const buffer = Buffer.from(base64Data, "base64");
    const key = `${prefix}${uuid()}`;
    console.log("Uploading to S3 with prefix:", prefix);
    console.log("Uploading to S3 with key:", key);
    console.log("Content Type:", contentType);
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    
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
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key) {
  // Implement if needed
}