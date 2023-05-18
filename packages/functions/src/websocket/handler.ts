import { provideActor } from '@unbind/core/actors';
import { useHeader } from 'sst/node/api';
import { WebSocketApiHandler } from 'sst/node/websocket-api';
import { Session } from 'sst/node/future/auth';

export const AuthenticatedWebSocketApiHandler = (
  cb: Parameters<typeof WebSocketApiHandler>[0]
) =>
  WebSocketApiHandler(async (evt, ctx) => {
    const token = useHeader('Sec-WebSocket-Protocol');
    const session = token
      ? Session.verify(token)
      : { type: 'public', properties: {} };
    provideActor(session as any);
    const res = await cb(evt, ctx);
    return res;
  });
