export const BUCKET = process.env.S3_BUCKET || "local-bucket";
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "sessions";

export const PROFILE_PREFIX = "profile/";
export const INE_PREFIX = "INE/";
export const WORK_PERMIT = "Work_permit/";
export const SERVICE_IMAGES_PREFIX = "service_images/";

export const TOKEN_EXPIRY = 86400;
export const SESSION_EXPIRY = 86400000;

// Nombres correctos de tablas DynamoDB
export const DYNAMODB_CHATS_TABLE = "chats";
export const DYNAMODB_MESSAGES_TABLE = "messages";