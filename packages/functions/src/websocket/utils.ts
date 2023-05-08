import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { WebSocketApi } from 'sst/node/api';

export const sendMessage = async (connectionId: string, data: any) => {
  const client = new ApiGatewayManagementApiClient({
    endpoint: WebSocketApi['ws-api'].url.replace('wss://', 'https://'),
  });
  return client.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: new TextEncoder().encode(JSON.stringify(data)),
    })
  );
};
