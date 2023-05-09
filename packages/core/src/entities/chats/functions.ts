import { generateId } from 'jfsi/node/entities';
import { NotFoundException } from 'jfsi/node/errors';
import { z } from 'zod';
import { publishEvent } from '../../event-bus';
import { zod } from '../../zod';
import { BaseChats, CHAT_MESSAGE_ROLE, ChatsEntity } from './base';
import { useActor } from '../../actors';

export const zMessage = z.object({
  role: z.enum(CHAT_MESSAGE_ROLE),
  content: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

export const createChat = zod(
  z.object({
    documentId: z.string(),
    organizationId: z.string().optional(),
    actorId: z.string().optional(),
  }),
  async ({ organizationId, documentId, actorId }) => {
    const actor = useActor();

    let organizationIdToUse = organizationId;
    let actorIdToUse = actorId;
    if (actor.type === 'user') {
      if (!organizationIdToUse) {
        organizationIdToUse = actor.properties.organizationId;
      }

      if (!actorIdToUse) {
        actorIdToUse = actor.properties.userId;
      }
    }

    const res = await ChatsEntity.create({
      organizationId: organizationIdToUse,
      documentId,
      chatId: generateId(`chat`),
      participantIds: actorIdToUse ? [actorIdToUse] : [],
      createdBy: actorIdToUse,
      status: 'idle',
      messages: [],
    } as any).go();

    return res.data;
  }
);

export const getChatById = zod(z.string(), async (chatId: string) => {
  const res = await ChatsEntity.query.chatById({ chatId }).go();
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

    const res = await BaseChats.setMessageToBeProcessed(
      ChatsEntity.update({
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
    ).go({ response: 'all_new' });

    // Push the event to a bus to be processed by a worker
    await publishEvent('chats.awaiting', {
      organizationId: chat.organizationId,
      documentId: chat.documentId,
      chatId: chat.chatId || chatId,
    });

    return res.data;
  }
);

export const setMessageToBeProcessing = zod(
  z.object({
    chatId: z.string(),
    documentId: z.string(),
    organizationId: z.string(),
  }),
  async ({ chatId, documentId, organizationId }) => {
    const res = await BaseChats.setMessageToBeProcessing(
      ChatsEntity.update({
        chatId,
        documentId,
        organizationId,
      })
    ).go();

    return res.data;
  }
);

export const completeMessageProcessing = zod(
  z.object({
    chatId: z.string(),
    documentId: z.string(),
    organizationId: z.string(),
    messages: z.array(zMessage),
  }),
  async ({ chatId, documentId, organizationId, messages }) => {
    const res = await BaseChats.completeMessageProcessing(
      ChatsEntity.update({
        chatId,
        documentId,
        organizationId,
      }),
      messages
    ).go({ response: 'all_new' });

    return res.data;
  }
);
