import { generateId } from 'jfsi/node/entities';
import { NotFoundException } from 'jfsi/node/errors';
import { z } from 'zod';
import { publishEvent } from '../../event-bus';
import { zod } from '../../zod';
import { BaseChats, ChatsEntity } from './base';

export const createChat = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    actorId: z.string().optional(),
  }),
  async ({ organizationId, documentId, actorId }) => {
    const res = await ChatsEntity.create({
      organizationId,
      documentId,
      chatId: generateId(`chat`),
      participantIds: actorId ? [actorId] : [],
      createdBy: actorId,
      status: 'idle',
      messages: [],
    } as any).go();

    return res.data;
  }
);

const getChatById = zod(z.string(), async (chatId: string) => {
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

    console.log(res);
    return res.data;
  }
);
