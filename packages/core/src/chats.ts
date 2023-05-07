import {
  DDB_KEYS,
  generateChatEntityDetails,
  generateId,
} from 'jfsi/node/entities';
import { NotFoundException } from 'jfsi/node/errors';
import { Configuration } from './dynamo';
import { zod } from './zod';
import { z } from 'zod';
import { publishEvent } from './event-bus';

const BaseChats = generateChatEntityDetails(Configuration, {
  service: 'unbind',
  version: '1',
  chatConfig: {
    model: {
      entity: 'chats',
      service: 'unbind',
      version: '1',
    },
    attributes: {
      /** The organization this chat belongs to */
      organizationId: { type: 'string', required: true },
      /** The document this chat is attached to */
      documentId: { type: 'string', required: true },
      /** A list of userIds that are participating in this chat */
      participantIds: {
        type: 'list',
        required: true,
        items: { type: 'string' },
        watch: ['messages'],
        // Automatically set the participantIds by the messages that are in the chat
        set: (_: any, { messages }: { messages: { userId?: string }[] }) => {
          return (
            messages
              .map((message) => message.userId)
              // Remove nulls and undefined
              .filter((val): val is string => Boolean(val))
              // Remove duplicates
              .reduce(
                (acc, curr) =>
                  acc.find((v) => v === curr) ? acc : [...acc, curr],
                [] as string[]
              )
          );
        },
      },
    },
    indexes: {
      chatByOrganizationId: {
        pk: {
          field: DDB_KEYS.defaultIndex.partitionKey,
          composite: ['organizationId', 'documentId'],
        },
        sk: {
          field: DDB_KEYS.defaultIndex.sortKey,
          composite: ['chatId'],
        },
      },
      chatById: {
        index: DDB_KEYS.gsi1.indexName,
        pk: { field: DDB_KEYS.gsi1.partitionKey, composite: ['chatId'] },
        sk: { field: DDB_KEYS.gsi1.sortKey, composite: [] },
      },
    },
  },
});

export const ChatsEntity = BaseChats.ChatEntity;

export const createChat = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    actorId: z.string(),
  }),
  async ({ organizationId, documentId, actorId }) => {
    const res = await BaseChats.ChatEntity.create({
      organizationId,
      documentId,
      chatId: generateId(`chat`),
      participantIds: [actorId],
      createdBy: actorId,
      status: 'idle',
      messages: [],
    } as any).go();

    return res.data;
  }
);

const getChatById = zod(z.string(), async (chatId: string) => {
  const res = await BaseChats.ChatEntity.query.chatById({ chatId }).go();
  return res.data[0] ?? null;
});

/**
 * Send a new message to a particular chat.
 */
export const sendMessage = zod(
  z.object({
    /** The chatId to send the message to */
    chatId: z.string(),
    /** The message to send */
    message: z.string(),
    /** The user that is sending the message */
    actorId: z.string(),
  }),
  async ({ chatId, message, actorId }) => {
    const chat = await getChatById(chatId);

    if (!chat) {
      throw new NotFoundException(`Unable to find chat with id ${chatId}`);
    }

    const processCall = await BaseChats.setMessageToBeProcessed(
      BaseChats.ChatEntity.update({
        chatId: chat.chatId,
        documentId: chat.documentId,
        organizationId: chat.organizationId,
      }),
      {
        role: 'user',
        content: message,
        userId: actorId,
        timestamp: new Date().toISOString(),
      }
    );

    const res = await processCall.go();

    // Push the event to a bus to be processed by a worker
    await publishEvent('chats.awaiting', {
      organizationId: chat.organizationId,
      documentId: chat.documentId,
      chatId: chat.chatId || chatId,
    });

    return res.data;
  }
);

export * as Chats from './chats';
