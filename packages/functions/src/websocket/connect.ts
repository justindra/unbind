import { assertActor } from '@unbind/core/actors';
import { Chats } from '@unbind/core/entities/chats';
import { Documents } from '@unbind/core/entities/documents';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { useQueryParam } from 'sst/node/api';
import { useConnectionId } from 'sst/node/websocket-api';
import { AuthenticatedWebSocketApiHandler } from './handler';

export const handler = AuthenticatedWebSocketApiHandler(async () => {
  const connectionId = useConnectionId();

  const documentId = useQueryParam('documentId');
  let chatId = useQueryParam('chatId');
  const user = assertActor('user');

  if (!documentId) {
    console.error('Unable to connect without documentId');
    return { statusCode: 400 };
  }

  const document = await Documents.getDocumentById({
    documentId,
    organizationId: user.properties.organizationId,
  });

  if (!document) {
    console.error(`Unable to find document with id ${documentId}`);
    return { statusCode: 404 };
  }

  // If no chatId is provided then create a new chat
  if (!chatId) {
    const res = await Chats.createChat({
      organizationId: user.properties.userId,
      documentId,
      actorId: user.properties.userId,
    });

    chatId = res.chatId;
  }

  await WebSocketConnections.connect({
    connectionId,
    documentId,
    chatId,
    userId: user.properties.userId,
    organizationId: user.properties.organizationId,
  });

  return { statusCode: 200 };
});
