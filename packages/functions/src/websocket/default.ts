import { WebSocketApiHandler, useConnectionId } from 'sst/node/websocket-api';

export const handler = WebSocketApiHandler(async () => {
  const connectionId = useConnectionId();
  console.log(connectionId);
  return { statusCode: 200 };
});
