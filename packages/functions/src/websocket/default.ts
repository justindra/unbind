import { assertActor } from '@unbind/core/actors';
import { createChat } from '@unbind/core/chats';
import { Documents } from '@unbind/core/documents';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
// import { WebsocketApiHandler, useConnectionId } from 'sst/node/websocket-api';
import { useQueryParam } from 'sst/node/api';
import { WebsocketApiHandler, useConnectionId } from './handler';

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();
  console.log(connectionId);
  return { statusCode: 200 };
});
