import { ListObjectsV2Command } from "@aws-sdk/client-s3";

import { s3Client } from "../config/aws.js";
import { BUCKET } from "../utils/constants.js";

export async function listS3Objects(prefix = 'profile/') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 20
    });
    
    const response = await s3Client.send(command);
    
    console.log('Objects in bucket:');
    if (response.Contents && response.Contents.length > 0) {
      response.Contents.forEach(obj => {
        console.log('  -', obj.Key);
      });
    } else {
      console.log('  No objects found with prefix:', prefix);
    }
    
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    throw error;
  }
}