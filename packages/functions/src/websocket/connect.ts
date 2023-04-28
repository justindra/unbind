import { WebsocketApiHandler, useConnectionId } from 'sst/node/websocket-api';
import { assertActor } from '@unbind/core/actors';
import { WebSocketConnections } from '@unbind/core/websocket-connections';

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();
  const user = assertActor('user');

  await WebSocketConnections.connect({
    connectionId,
    userId: user.properties.userId,
  });

  return { statusCode: 200 };
});
