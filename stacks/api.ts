import { StackContext, Api, use, WebSocketApi } from 'sst/constructs';
import { DataStack } from './data';
import { AuthStack } from './auth';

export function APIStack({ app, stack }: StackContext) {
  const { table, filesBucket, eventBus } = use(DataStack);
  const { auth } = use(AuthStack);

  // const openAI = Config.Secret.create(stack, 'OPENAI_API_KEY');
  // new Function(stack, 'TestFunction', {
  //   handler: 'packages/functions/src/test.handler',
  //   bind: [
  //     openAI.OPENAI_API_KEY,
  //     pinecone.PINECONE_API_KEY,
  //     pinecone.PINECONE_ENV,
  //     pinecone.PINECONE_INDEX,
  //   ],
  // });

  // TRPC API
  const api = new Api(stack, 'api', {
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
        bind: [table, auth],
      },
    },
    // customDomain: {
    //   path: 'chat',
    //   cdk: { domainName: api.cdk.domainName },
    // },
    routes: {
      $connect: 'packages/functions/src/websocket/connect.handler',
      $disconnect: 'packages/functions/src/websocket/disconnect.handler',
      $default: 'packages/functions/src/websocket/default.handler',
    },
  });

  ws.addRoutes(stack, {
    ['send-message']: {
      function: {
        handler: 'packages/functions/src/websocket/send-message.handler',
        bind: [ws],
      },
    },
  });

  stack.addOutputs({
    apiUrl: api.customDomainUrl || api.url,
    websocketUrl: ws.customDomainUrl || ws.url,
  });

  return {
    api,
  };
}
