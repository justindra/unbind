import {
  ApiGatewayManagementApi,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { WebSocketConnections } from '@unbind/core/websocket-connections';
import { useJsonBody } from 'sst/node/api';
import { WebsocketApiHandler, useConnectionId } from 'sst/node/websocket-api';

const wsClient = new ApiGatewayManagementApi({});

const sendMessage = async (connectionId: string, data: any) => {
  return wsClient.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: new TextEncoder().encode(JSON.stringify(data)),
    })
  );
};

export const handler = WebsocketApiHandler(async () => {
  const connectionId = useConnectionId();

  const body = useJsonBody();
  // A user has just sent a message into the system for a particular document
  const message = body.message;
  const documentId = body.documentId;

  // Get the user details based on the connectionId
  const connection = await WebSocketConnections.getConnectionById(connectionId);

  if (!connection) {
    // Broadcast back to the connectionId that it is not ready.
  }
  // Get the document and make sure it is ready to accept messages.
  // If not then broadcast back to the connectionId that it is not ready.

  // Get all other connections for the same user
  const activeConnections = await WebSocketConnections.getConnectionsByUserId(
    connection.userId
  );

  // Send message/query to the AI system and then stream back the results
  // via websockets to all connections for that same user

  await sendMessage(connectionId, { message: 'Hello World', documentId });

  // Or should we always return and then do all of this in a separate Lambda function through a Queue?

  return { statusCode: 200 };
});
