import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { useConnectionId } from 'sst/node/websocket-api';
import { AuthenticatedWebSocketApiHandler } from './handler';

export const handler = AuthenticatedWebSocketApiHandler(async () => {
  const connectionId = useConnectionId();

  const connection = await WebSocketConnections.getConnectionById(connectionId);

  await WebSocketConnections.disconnect({
    connectionId: connection.connectionId,
  });

  return { statusCode: 200 };
});
