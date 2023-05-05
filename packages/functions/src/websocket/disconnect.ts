// import { WebsocketApiHandler, useConnectionId } from 'sst/node/websocket-api';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { WebsocketApiHandler, useConnectionId } from './handler';

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();

  // const connection = await WebSocketConnections.getConnectionById(connectionId);

  // await WebSocketConnections.disconnect({
  //   connectionId: connection.connectionId,
  // });

  return { statusCode: 200 };
});
