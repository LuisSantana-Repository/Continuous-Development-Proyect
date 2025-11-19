import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { dynamoDBClient } from "../config/aws.js";
import { getPrimaryPool } from "../config/database.js";
import {
  DYNAMODB_CHATS_TABLE,
  DYNAMODB_MESSAGES_TABLE,
} from "../utils/constants.js";

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

/**
 * Create or get existing chat for a specific service request
 * Each service request has its own dedicated chat
 */
export async function getOrCreateChatForRequest(
  userId,
  providerId,
  serviceRequestId
) {
  try {
    // First, try to find chat by service_request_id
    const queryParams = {
      TableName: DYNAMODB_CHATS_TABLE,
      IndexName: "ServiceRequestIndex",
      KeyConditionExpression: "service_request_id = :serviceRequestId",
      ExpressionAttributeValues: {
        ":serviceRequestId": serviceRequestId,
      },
    };

    const result = await docClient.send(new QueryCommand(queryParams));

    if (result.Items && result.Items.length > 0) {
      // Chat exists for this service request, return it
      console.log(
        "Chat already exists for service request:",
        result.Items[0].chat_id
      );
      return result.Items[0];
    }

    // Chat doesn't exist, create new one linked to service request
    const chatId = uuid();
    const now = Date.now();

    const newChat = {
      chat_id: chatId,
      user_id: userId,
      provider_id: parseInt(providerId),
      service_request_id: serviceRequestId,
      created_at: now,
      last_message_at: now,
      last_message: null,
      unread_count_user: 0,
      unread_count_provider: 0,
    };

    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        Item: newChat,
      })
    );

    console.log(
      "New chat created for service request:",
      serviceRequestId,
      "-> chatId:",
      chatId
    );
    return newChat;
  } catch (error) {
    console.error("Error getting or creating chat for request:", error);
    throw error;
  }
}

/**
 * Get chat by ID
 */
export async function getChatById(chatId) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        Key: { chat_id: chatId },
      })
    );

    if (!result.Item) {
      throw new Error("CHAT_NOT_FOUND");
    }

    return result.Item;
  } catch (error) {
    console.error("Error getting chat:", error);
    throw error;
  }
}

/**
 * Get all chats for a user
 */
export async function getUserChats(userId) {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        IndexName: "UserProviderIndex",
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Most recent first
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
}

/**
 * Get chats for provider
 */
export async function getProviderChat(provider_id) {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        IndexName: "ProviderIndex",
        KeyConditionExpression: "provider_id = :provider_id",
        ExpressionAttributeValues: {
          ":provider_id": provider_id,
        },
        ScanIndexForward: false, // Most recent first
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
}
/**
 * Send a message
 */
export async function sendMessage(
  chatId,
  senderId,
  content,
  isProvider = false
) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💾 sendMessage() CALLED");
  console.log("Parameters:", {
    chatId,
    senderId,
    content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
    isProvider,
  });

  try {
    const messageId = uuid();
    const timestamp = Date.now();

    const message = {
      message_id: messageId,
      chat_id: chatId,
      sender_id: senderId,
      content: content,
      timestamp: timestamp,
      is_provider: isProvider,
      read_by_user: isProvider ? false : true,
      read_by_provider: isProvider ? true : false,
    };

    console.log("📝 Message object created:", JSON.stringify(message, null, 2));

    // Save message
    console.log("💾 Saving to DynamoDB table:", DYNAMODB_MESSAGES_TABLE);
    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_MESSAGES_TABLE,
        Item: message,
      })
    );
    console.log("✅ Message saved to DynamoDB");

    // Update chat's last message
    console.log("🔄 Updating chat's last message...");
    await docClient.send(
      new UpdateCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        Key: { chat_id: chatId },
        UpdateExpression:
          "SET last_message = :content, last_message_at = :timestamp, " +
          (isProvider
            ? "unread_count_user = unread_count_user + :inc"
            : "unread_count_provider = unread_count_provider + :inc"),
        ExpressionAttributeValues: {
          ":content": content,
          ":timestamp": timestamp,
          ":inc": 1,
        },
      })
    );
    console.log("✅ Chat updated");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ sendMessage() COMPLETED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return message;
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ERROR in sendMessage()");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    throw error;
  }
}

/**
 * Get messages for a chat with pagination
 */
export async function getChatMessages(
  chatId,
  limit = 50,
  lastTimestamp = null
) {
  try {
    const params = {
      TableName: DYNAMODB_MESSAGES_TABLE,
      KeyConditionExpression: "chat_id = :chatId",
      ExpressionAttributeValues: {
        ":chatId": chatId,
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    };

    // Add pagination if lastTimestamp provided
    if (lastTimestamp) {
      params.ExclusiveStartKey = {
        chat_id: chatId,
        timestamp: lastTimestamp,
      };
    }

    const result = await docClient.send(new QueryCommand(params));

    return {
      messages: result.Items || [],
      lastTimestamp: result.LastEvaluatedKey?.timestamp || null,
    };
  } catch (error) {
    console.error("Error getting messages:", error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(chatId, isProvider = false) {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: DYNAMODB_CHATS_TABLE,
        Key: { chat_id: chatId },
        UpdateExpression: isProvider
          ? "SET unread_count_provider = :zero"
          : "SET unread_count_user = :zero",
        ExpressionAttributeValues: {
          ":zero": 0,
        },
      })
    );

    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

export async function getProviderIdUsingUserId(user_id) {
  const pool = await getPrimaryPool();
  const [rows] = await pool.execute(
    `SELECT provider_id FROM providers WHERE user_id = ?`,
    [user_id]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0].provider_id;
}

export async function getProviderName(providerId) {
  const pool = await getPrimaryPool();
  const [rows] = await pool.execute(
    `SELECT workname FROM providers WHERE provider_id = ?`,
    [providerId]
  );
  console.log("Provider query result:", rows);
  if (rows.length === 0) {
    return null;
  }
  return rows[0].workname;
}

export async function getUserName(user_id) {
  const pool = await getPrimaryPool();
  const [rows] = await pool.execute(
    `SELECT username FROM users WHERE user_id = ?`,
    [user_id]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0].username;
}
