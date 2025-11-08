import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { dynamoDBClient } from "../config/aws.js";
import {getPrimaryPool} from "../config/database.js";
import { DYNAMODB_CHATS_TABLE, DYNAMODB_MESSAGES_TABLE } from "../utils/constants.js";

const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

/**
 * Create or get existing chat between user and provider
 */
export async function getOrCreateChat(userId, providerId) {
    try {
        const queryParams = {
            TableName: DYNAMODB_CHATS_TABLE,
            IndexName: "UserProviderIndex",
            KeyConditionExpression: "user_id = :userId AND provider_id = :providerId",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":providerId": parseInt(providerId),
            },
        };

        const result = await docClient.send(new QueryCommand(queryParams));

        if (result.Items && result.Items.length > 0) {
            // Chat exists, return it
            console.log("Chat already exists:", result.Items[0].chat_id);
            return result.Items[0];
        }

        // Chat doesn't exist, create new one
        const chatId = uuid();
        const now = Date.now();

        const newChat = {
            chat_id: chatId,
            user_id: userId,
            provider_id: parseInt(providerId),
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

        console.log("New chat created:", chatId);
        return newChat;
    } catch (error) {
        console.error("Error getting or creating chat:", error);
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
                IndexName: "UserProviderIndex",
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
export async function sendMessage(chatId, senderId, content, isProvider = false) {
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

        // Save message
        await docClient.send(
            new PutCommand({
                TableName: DYNAMODB_MESSAGES_TABLE,
                Item: message,
            })
        );

        // Update chat's last message
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

        return message;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

/**
 * Get messages for a chat with pagination
 */
export async function getChatMessages(chatId, limit = 50, lastTimestamp = null) {
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
