import { queryDocument, queryDocumentChat } from '@unbind/core/analysis';
import {
  completeMessageProcessing,
  getChatById,
  setMessageToBeProcessing,
} from '@unbind/core/entities/chats/functions';
import { Organizations } from '@unbind/core/entities/organizations';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { ValidationException } from 'jfsi/node/errors';
import { EventBridgeWrapper } from 'jfsi/node/event-bus';

/**
 * Process a chat that is awaiting to be actioned by OpenAI
 */
export const handler = EventBridgeWrapper<'chats.awaiting'>(async (evt) => {
  if (evt['detail-type'] !== 'chats.awaiting') return;

  const { chatId, documentId, organizationId } = evt.detail;

  const openAIApiKey = await Organizations.getOpenAIKey(organizationId);

  if (!openAIApiKey) {
    throw new ValidationException(
      'OpenAI API Key not set for the organization, please set and try again.'
    );
  }

  const currentChat = await getChatById(chatId);

  if (!currentChat) {
    console.log(`Chat ${chatId} not found, skipping...`);
    return;
  }
  if (currentChat.status !== 'awaiting') {
    console.log(`Chat ${chatId} is not awaiting, skipping...`);
    return;
  }

  await setMessageToBeProcessing({
    chatId: currentChat.chatId,
    documentId: currentChat.documentId,
    organizationId: currentChat.organizationId,
  });

  //   TODO: get connections for a chat instead of user
  const connections = await WebSocketConnections.getConnectionsByUserId('');

  // Remove the last message from the chathistory as that is the query that we
  // want to send
  const chatHistory = currentChat.messages.slice(0, -1);
  const query = currentChat.messages[currentChat.messages.length - 1].content;

  const res = await queryDocumentChat({
    organizationId,
    documentId,
    chatHistory,
    query,
    openAIApiKey,
    callback: connections.length
      ? (token) => {
          console.log(
            `token: ${token} to send to ${connections
              .map((val) => val.connectionId)
              .join(', ')}`
          );
        }
      : (token) => {
          console.log(`token: ${token}`);
        },
    timestamp: currentChat.updatedAt || new Date().toISOString(),
  });

  console.log(res.messages[res.messages.length - 1].resources);

  // Update to indicate that the chat is now idle
  const updatedChat = await completeMessageProcessing({
    chatId: currentChat.chatId,
    documentId: currentChat.documentId,
    organizationId: currentChat.organizationId,
    messages: res.messages,
  });
  console.log(`Chat ${updatedChat.chatId} updated to idle`);
});
