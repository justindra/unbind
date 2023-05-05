import {
  DDB_KEYS,
  generateChatEntityDetails,
  generateId,
} from 'jfsi/node/entities';
import { Configuration } from './dynamo';
import { EntityItem } from 'electrodb';
import { zod } from './zod';
import { z } from 'zod';

const Chats = generateChatEntityDetails(Configuration, {
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
    },
  },
});

type Info = EntityItem<typeof Chats.ChatEntity>;

// Chats.ChatEntity.update({
//   chatId: '123',
// });

export const ChatsEntity = Chats.ChatEntity;

export const createChat = zod(
  z.object({
    organizationId: z.string(),
    documentId: z.string(),
    actorId: z.string(),
  }),
  async ({ organizationId, documentId, actorId }) => {
    const res = await Chats.ChatEntity.create({
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
