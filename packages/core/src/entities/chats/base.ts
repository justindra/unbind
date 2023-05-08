import { DDB_KEYS, generateChatEntityDetails } from 'jfsi/node/entities';
import { Configuration } from '../../dynamo';

// TODO: Replace with one from jfsi once released
export const CHAT_MESSAGE_ROLE = ['system', 'user', 'assistant'] as const;
export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLE)[number];

export const BaseChats = generateChatEntityDetails(Configuration, {
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
      messages: {
        type: 'list',
        required: true,
        default: [],
        items: {
          type: 'map',
          properties: {
            /** The role determines who sent that message */
            role: {
              type: CHAT_MESSAGE_ROLE,
              required: true,
            },
            content: { type: 'string', required: true },
            /** The id of the user that sent this message, if any */
            userId: { type: 'string' },
            /** The time the message was sent in as an ISO date */
            timestamp: { type: 'string' },
            /** Any resources that were used to provide context to this message */
            resources: {
              type: 'list',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    indexes: {
      chatByOrganizationId: {
        collection: 'documents',
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
