import { WebsocketApiHandler, useConnectionId } from './handler';

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();
  console.log(connectionId);
  return { statusCode: 200 };
});
