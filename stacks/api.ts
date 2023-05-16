import { StackContext, Api, use, WebSocketApi } from 'sst/constructs';
import { DataStack } from './data';
import { AuthStack } from './auth';
import { DomainUtils, HOSTED_ZONE } from './constants';

export function APIStack({ app, stack }: StackContext) {
  const { table, filesBucket, eventBus, pinecone } = use(DataStack);
  const { auth } = use(AuthStack);

  // TRPC API
  const api = new Api(stack, 'api', {
    customDomain: {
      domainName: DomainUtils.getApiDomain(app),
      hostedZone: HOSTED_ZONE,
    },
    defaults: {
      function: {
        bind: [table, auth, filesBucket, eventBus],
      },
    },
    routes: {
      'GET /{proxy+}': {
        function: {
          handler: 'packages/functions/src/trpc.handler',
          bind: [],
        },
      },
      'POST /{proxy+}': {
        function: {
          handler: 'packages/functions/src/trpc.handler',
          bind: [],
        },
      },
    },
  });

  const ws = new WebSocketApi(stack, 'ws-api', {
    defaults: {
      function: {
        bind: [table, auth, eventBus],
      },
    },
    customDomain: {
      domainName: DomainUtils.getWebDomain(app, 'ws'),
      hostedZone: HOSTED_ZONE,
    },
    routes: {
      $connect: 'packages/functions/src/websocket/connect.handler',
      $disconnect: 'packages/functions/src/websocket/disconnect.handler',
      $default: 'packages/functions/src/websocket/default.handler',
    },
  });

  eventBus.addRules(stack, {
    ProcessAwaitingMessages: {
      pattern: {
        source: ['unbind'],
        detailType: ['chats.awaiting'],
      },
      cdk: {
        rule: {
          description: 'Process a chat that is awaiting a response from OpenAI',
        },
      },
      targets: {
        processAwaitingChat: {
          function: {
            handler: 'packages/functions/src/chats/process-awaiting.handler',
            bind: [
              table,
              eventBus,
              pinecone.PINECONE_API_KEY,
              pinecone.PINECONE_ENV,
              pinecone.PINECONE_INDEX,
              ws,
            ],
            timeout: '5 minutes', // Just in case OpenAI takes a while to respond
          },
        },
      },
    },
  });

  stack.addOutputs({
    apiUrl: api.customDomainUrl || api.url,
    websocketUrl: ws.customDomainUrl || ws.url,
  });

  return { api, ws };
}
