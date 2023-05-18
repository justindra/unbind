import { Entity, EntityItem } from 'electrodb';
import { AUDIT_FIELDS, DDB_KEYS } from 'jfsi/node/entities';
import { Configuration } from './dynamo';
import { zod } from './zod';
import { z } from 'zod';

/**
 * This is the entity to keep track of all the different WebSocket connections
 * that is currently ongoing throughout the system. A user can have multiple
 * connections going on at the same time.
 */
const WebSocketConnectionsEntity = new Entity(
  {
    model: {
      version: '1',
      service: 'unbind',
      entity: 'websocket-connections',
    },
    attributes: {
      ...AUDIT_FIELDS,
      organizationId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      documentId: { type: 'string', required: true },
      connectionId: { type: 'string', required: true },
      chatId: { type: 'string', required: true },
      status: { type: ['connected', 'disconnected'], required: true },
      connectedAt: { type: 'string', required: true },
      disconnectedAt: { type: 'string' },
    },
    indexes: {
      connectionsByUserId: {
        pk: {
          field: DDB_KEYS.defaultIndex.partitionKey,
          composite: ['userId'],
        },
        sk: {
          field: DDB_KEYS.defaultIndex.sortKey,
          composite: ['documentId', 'chatId', 'connectionId'],
        },
      },
      connectionsById: {
        index: DDB_KEYS.gsi1.indexName,
        pk: { field: DDB_KEYS.gsi1.partitionKey, composite: ['connectionId'] },
        sk: { field: DDB_KEYS.gsi1.sortKey, composite: [] },
      },
    },
  },
  Configuration
);

export type Info = EntityItem<typeof WebSocketConnectionsEntity>;

/**
 * Connect a WebSocket connection, this will create a new record in the database
 * with the `connectedAt` field set to the current time.
 */
export const connect = zod(
  z.object({
    connectionId: z.string(),
    userId: z.string(),
    organizationId: z.string(),
    documentId: z.string(),
    chatId: z.string(),
  }),
  async ({ connectionId, userId, organizationId, documentId, chatId }) => {
    const res = await WebSocketConnectionsEntity.create({
      userId,
      documentId,
      connectionId,
      organizationId,
      chatId,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    }).go();

    return res.data;
  }
);

/**
 * Disconnect a WebSocket connection, this will update the `disconnectedAt`
 * field in the database.
 *
 * TODO: just delete the record instead of updating it.
 */
export const disconnect = zod(
  z.object({
    connectionId: z.string(),
  }),
  async ({ connectionId }) => {
    const connection = await getConnectionById(connectionId);
    const res = await WebSocketConnectionsEntity.update({
      userId: connection.userId,
      connectionId: connection.connectionId,
      documentId: connection.documentId,
      chatId: connection.chatId,
    })
      .set({
        status: 'disconnected',
        disconnectedAt: new Date().toISOString(),
      })
      .go();

    return res.data;
  }
);

/**
 * Get a connection by its connection Id
 */
export const getConnectionById = zod(z.string(), async (connectionId) => {
  const res = await WebSocketConnectionsEntity.query
    .connectionsById({ connectionId })
    .go();

  return res.data[0];
});

/**
 * Get a list of all connections for a given user.
 */
export const getConnectionsByUserId = zod(z.string(), async (userId) => {
  const res = await WebSocketConnectionsEntity.query
    .connectionsByUserId({ userId })
    .where(({ status }, { eq }) => eq(status, 'connected'))
    .go();

  return res.data;
});

export * as WebSocketConnections from './websocket-connections';
