import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { useJsonBody } from 'sst/node/api';
import { WebsocketApiHandler, useConnectionId } from './handler';
import { WebSocketApi } from 'sst/node/api';
import { sendMessage } from './utils';

export const handler = WebsocketApiHandler(async (event) => {
  const connectionId = useConnectionId();
  console.log(connectionId);
  const body = useJsonBody();
  // A user has just sent a message into the system for a particular document
  const message = body.message;
  console.log(message);
  // Get the user details based on the connectionId
  // const connection = await WebSocketConnections.getConnectionById(connectionId);
  // if (!connection) {
  //   // Broadcast back to the connectionId that it is not ready.
  //   await sendMessage(connectionId, {
  //     message: 'The connection you are communication on is invalid.',
  //   });
  //   return { statusCode: 200 };
  // }

  // const documentId = connection.documentId;
  // // Get the document and make sure it is ready to accept messages.
  // // If not then broadcast back to the connectionId that it is not ready.
  // const document = await Documents.getDocumentById({
  //   documentId,
  //   organizationId: connection.organizationId,
  // });

  // if (!document) {
  //   // Broadcast back to the connectionId that it is not ready.
  //   await sendMessage(connectionId, {
  //     message: 'We were unable to find that document.',
  //     documentId,
  //   });
  //   return { statusCode: 200 };
  // }

  // Update document with the latest message and update it to be in a query state, which should trigger
  // the AI to start processing it elsewhere and then send back the results via websockets to all connections.

  // Get all other connections for the same document.
  // const activeConnections = await WebSocketConnections.getConnectionsByUserId(
  //   connection.userId
  // );

  // Send message/query to the AI system and then stream back the results
  // via websockets to all connections for that same user
  try {
    await sendMessage(connectionId, {
      action: 'hello',
      message: 'Hello World',
      documentId: '',
    });
  } catch (err) {
    console.error(err);
  }

  // Or should we always return and then do all of this in a separate Lambda function through a Queue?

  return { statusCode: 200 };
});
