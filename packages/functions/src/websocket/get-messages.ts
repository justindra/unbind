/**
 * Get all messages that has been sent so far for a particular document.
 *
 * This will be used to populate the chat history for a particular document.
 * Generally get this whenever the user opens a document and starts a new
 * connection.
 */

import { Documents } from '@unbind/core/documents';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { WebsocketApiHandler, useConnectionId } from './handler';

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();

  // Get the user details based on the connectionId
  const connection = await WebSocketConnections.getConnectionById(connectionId);

  if (!connection) {
    // Broadcast back to the connectionId that it is not ready.
    await sendMessage(connectionId, {
      message: 'The connection you are communicating on is invalid.',
      documentId,
    });
    return { statusCode: 400 };
  }
  // Get the document and make sure it is ready to accept messages.
  // If not then broadcast back to the connectionId that it is not ready.
  const document = await Documents.getDocumentById({
    documentId: connection.documentId,
    organizationId: connection,
  });

  if (!document) {
    // Broadcast back to the connectionId that it is not ready.
    await sendMessage(connectionId, {
      message: 'We were unable to find that document.',
      documentId: connection.documentId,
    });
    return { statusCode: 400 };
  }

  // TODO: Get all messages from document and send it across the socket

  await sendMessage(connectionId, { message: 'Hello World', documentId });

  return { statusCode: 200 };
});
