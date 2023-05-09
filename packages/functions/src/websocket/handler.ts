import { provideActor } from '@unbind/core/actors';
import { APIGatewayEventWebsocketRequestContextV2 } from 'aws-lambda';
import { Handler, useEvent } from 'sst/context';
import { ApiHandler, useHeader, useHeaders } from 'sst/node/api';
import { Session } from 'sst/node/future/auth';

// TODO: Once this PR is merged, replace with the official version
// in SST
// https://github.com/serverless-stack/sst/pull/2817
export const WebsocketApiHandler = (cb: Parameters<typeof ApiHandler>[0]) =>
  Handler('api', async (evt, ctx) => {
    const token = useHeader('Sec-WebSocket-Protocol');
    const session = token
      ? Session.verify(token)
      : { type: 'public', properties: {} };
    provideActor(session as any);
    const res = await cb(evt, ctx);
    return {
      ...res,
      headers: { 'Sec-WebSocket-Protocol': token },
    };
  });

export function useConnectionId() {
  const event = useEvent('api');
  return (
    event.requestContext as any as APIGatewayEventWebsocketRequestContextV2
  ).connectionId;
}
